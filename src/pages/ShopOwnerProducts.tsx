import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useToast } from '../hooks/use-toast';
import { 
  Package, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  Filter,
  LogOut,
  ArrowLeft,
  Building2,
  FolderOpen,
  Truck,
  DollarSign,
  AlertTriangle
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  cost_price: number;
  sku: string;
  is_active: boolean;
  brand: string;
  model: string;
  created_at: string;
  category_id?: string;
  supplier_id?: string;
  image_url?: string; // Now stores base64 data URL
  inventory?: {
    quantity: number;
    min_stock_level: number;
  }[];
  categories?: { name: string };
  suppliers?: { name: string };
}

interface Category {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  sort_order: number;
}

interface Supplier {
  id: string;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  is_active: boolean;
}



// Product Image Component for Base64 Storage
const ProductImage: React.FC<{ imageData: string; productName: string }> = ({ imageData, productName }) => {
  if (!imageData) {
    return (
      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
        <div className="text-gray-400">No image</div>
      </div>
    );
  }

  return (
    <img 
      src={imageData} 
      alt={productName}
      className="w-full h-full object-cover"
    />
  );
};

const ShopOwnerProducts: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);


  const [shop, setShop] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'suppliers'>('products');

  // Product form state
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    cost_price: '',
    sku: '',
    brand: '',
    model: '',
    category_id: 'none',
    supplier_id: 'none',
    stock_quantity: '',
    min_stock_level: '',
    is_active: true
  });
  const [productImage, setProductImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  // Category form state
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    is_active: true,
    sort_order: 0
  });

  // Supplier form state
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    is_active: true
  });



  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterSupplier, setFilterSupplier] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/shop-owner-auth');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*, shops(*)')
        .eq('id', user.id)
        .single();

      if (profile?.shops) {
        setShop(profile.shops);
        
        const [productsRes, categoriesRes, suppliersRes] = await Promise.all([
          supabase
            .from('products')
            .select(`
              *,
              inventory(
                quantity,
                reorder_point
              )
            `)
            .eq('shop_id', profile.shops.id)
            .order('created_at', { ascending: false }),
          supabase
            .from('categories')
            .select('*')
            .eq('shop_id', profile.shops.id)
            .order('sort_order', { ascending: true }),
          supabase
            .from('suppliers')
            .select('*')
            .eq('shop_id', profile.shops.id)
            .order('name', { ascending: true })
        ]);

        setProducts(productsRes.data || []);
        setCategories(categoriesRes.data || []);
        setSuppliers(suppliersRes.data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load data'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/shop-owner-auth');
    } catch (error) {
      console.error('Error during logout:', error);
      navigate('/shop-owner-auth');
    }
  };

  // Image handling functions
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (5MB limit for base64 conversion)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: 'destructive',
          title: 'File Too Large',
          description: 'Please select an image smaller than 5MB'
        });
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          variant: 'destructive',
          title: 'Invalid File Type',
          description: 'Please select an image file'
        });
        return;
      }
      
      setProductImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const convertImageToBase64 = async (file: File): Promise<string | null> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        resolve(base64String);
      };
      reader.onerror = () => {
        console.error('Error reading file');
        resolve(null);
      };
      reader.readAsDataURL(file);
    });
  };



  // Product management functions
  const createActivityLog = async (action: string, details: any) => {
    try {
      await supabase
        .from('activity_logs')
        .insert({
          shop_id: shop.id,
          action,
          details: JSON.stringify(details),
          table_name: 'products',
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error creating activity log:', error);
    }
  };

  const checkLowStockAlert = async (productId: string, productName: string, quantity: number, reorderPoint: number) => {
    if (quantity <= reorderPoint && reorderPoint > 0) {
      await createActivityLog('low_stock_alert', {
        product_id: productId,
        product_name: productName,
        current_stock: quantity,
        reorder_point: reorderPoint
      });
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const productData = {
        shop_id: shop.id,
        name: productForm.name,
        description: productForm.description,
        price: parseFloat(productForm.price),
        cost_price: parseFloat(productForm.cost_price),
        sku: productForm.sku,
        brand: productForm.brand,
        model: productForm.model,
        category_id: productForm.category_id === 'none' ? null : productForm.category_id,
        supplier_id: productForm.supplier_id === 'none' ? null : productForm.supplier_id,
        is_active: productForm.is_active
      };

      let productId: string;

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;
        productId = editingProduct.id;

        // Create activity log for product update
        await createActivityLog('product_updated', {
          product_id: productId,
          product_name: productForm.name,
          previous_name: editingProduct.name
        });

        // Update inventory information
        if (productForm.stock_quantity !== '' || productForm.min_stock_level !== '') {
          const inventoryData = {
            shop_id: shop.id,
            product_id: productId,
            quantity: parseInt(productForm.stock_quantity) || 0,
            reorder_point: parseInt(productForm.min_stock_level) || 0,
            updated_at: new Date().toISOString()
          };

          // Check if inventory record exists
          const { data: existingInventory } = await supabase
            .from('inventory')
            .select('id')
            .eq('product_id', productId)
            .eq('shop_id', shop.id)
            .single();

          if (existingInventory) {
            // Update existing inventory record
            console.log('Updating existing inventory:', existingInventory.id, inventoryData);
            
            const { data: updateResult, error: inventoryError } = await supabase
              .from('inventory')
              .update(inventoryData)
              .eq('id', existingInventory.id)
              .select('*')
              .single();

            if (inventoryError) {
              console.error('Error updating inventory:', inventoryError);
              toast({
                variant: 'destructive',
                title: 'Inventory Update Failed',
                description: 'Product updated but stock information could not be updated'
              });
            } else {
              console.log('Inventory updated successfully:', updateResult);
              
              // Check for low stock alert
              await checkLowStockAlert(
                productId, 
                productForm.name, 
                inventoryData.quantity, 
                inventoryData.reorder_point
              );
            }
          } else {
            // Create new inventory record
            console.log('Creating new inventory record for existing product:', inventoryData);
            
            const { data: createResult, error: inventoryError } = await supabase
              .from('inventory')
              .insert(inventoryData)
              .select('*')
              .single();

            if (inventoryError) {
              console.error('Error creating inventory:', inventoryError);
              toast({
                variant: 'destructive',
                title: 'Inventory Creation Failed',
                description: 'Product updated but stock information could not be created'
              });
            } else {
              console.log('Inventory created successfully for existing product:', createResult);
              
              // Check for low stock alert
              await checkLowStockAlert(
                productId, 
                productForm.name, 
                inventoryData.quantity, 
                inventoryData.reorder_point
              );
            }
          }
        }

        toast({
          title: 'Product Updated! ✅',
          description: 'Product has been updated successfully'
        });
      } else {
        const { data, error } = await supabase
          .from('products')
          .insert(productData)
          .select('id')
          .single();

        if (error) throw error;
        productId = data.id;

        // Create activity log for new product
        await createActivityLog('product_created', {
          product_id: productId,
          product_name: productForm.name,
          sku: productForm.sku
        });

        // Create inventory record for new product
        if (productForm.stock_quantity !== '' || productForm.min_stock_level !== '') {
          const inventoryData = {
            shop_id: shop.id,
            product_id: productId,
            quantity: parseInt(productForm.stock_quantity) || 0,
            reorder_point: parseInt(productForm.min_stock_level) || 0,
            updated_at: new Date().toISOString()
          };

          console.log('Creating inventory record:', inventoryData);

          const { data: inventoryResult, error: inventoryError } = await supabase
            .from('inventory')
            .insert(inventoryData)
            .select('*')
            .single();

          if (inventoryError) {
            console.error('Error creating inventory:', inventoryError);
            toast({
              variant: 'destructive',
              title: 'Inventory Creation Failed',
              description: 'Product created but stock information could not be created'
            });
          } else {
            console.log('Inventory created successfully:', inventoryResult);
            
            // Check for low stock alert
            await checkLowStockAlert(
              productId, 
              productForm.name, 
              inventoryData.quantity, 
              inventoryData.reorder_point
            );
          }
        }

        toast({
          title: 'Product Created! ✅',
          description: 'New product has been added successfully'
        });
      }

                                         // Convert and store image as base64 if provided
              if (productImage) {
                try {
                  const base64Image = await convertImageToBase64(productImage);
                  if (base64Image) {
                    console.log('Base64 image length:', base64Image.length);
                    console.log('Base64 image preview (first 100 chars):', base64Image.substring(0, 100));
                    
                    // Check if image is too large (base64 can be very long)
                    if (base64Image.length > 1000000) { // 1MB limit
                      toast({
                        variant: 'destructive',
                        title: 'Image Too Large',
                        description: 'Please use a smaller image (under 1MB)'
                      });
                      return;
                    }
                    
                    // Try to update just the image field
                    const { error: updateError } = await supabase
                      .from('products')
                      .update({ 
                        image_url: base64Image.substring(0, 1000000) // Limit to 1MB
                      })
                      .eq('id', productId);
                    
                    if (updateError) {
                      console.error('Error updating image:', updateError);
                      console.error('Error details:', updateError.message);
                      toast({
                        variant: 'destructive',
                        title: 'Image Update Failed',
                        description: 'Product saved but image could not be processed'
                      });
                    } else {
                      console.log('Image updated successfully');
                    }
                  }
                } catch (imageError) {
                  console.error('Error processing image:', imageError);
                  toast({
                    variant: 'destructive',
                    title: 'Image Processing Failed',
                    description: 'Product saved but image could not be processed'
                  });
                }
              }

      // Update local state immediately for instant UI updates
      if (editingProduct) {
        // Update existing product in local state
        setProducts(prevProducts => 
          prevProducts.map(p => 
            p.id === editingProduct.id 
              ? {
                  ...p,
                  name: productForm.name,
                  description: productForm.description,
                  price: parseFloat(productForm.price),
                  cost_price: parseFloat(productForm.cost_price),
                  sku: productForm.sku,
                  brand: productForm.brand,
                  model: productForm.model,
                  category_id: productForm.category_id === 'none' ? null : productForm.category_id,
                  supplier_id: productForm.supplier_id === 'none' ? null : productForm.supplier_id,
                  is_active: productForm.is_active,
                  inventory: [{
                    quantity: parseInt(productForm.stock_quantity) || 0,
                    reorder_point: parseInt(productForm.min_stock_level) || 0
                  }]
                }
              : p
          )
        );
      } else {
        // Add new product to local state
        const newProduct = {
          id: productId,
          shop_id: shop.id,
          name: productForm.name,
          description: productForm.description,
          price: parseFloat(productForm.price),
          cost_price: parseFloat(productForm.cost_price),
          sku: productForm.sku,
          brand: productForm.brand,
          model: productForm.model,
          category_id: productForm.category_id === 'none' ? null : productForm.category_id,
          supplier_id: productForm.supplier_id === 'none' ? null : productForm.supplier_id,
          is_active: productForm.is_active,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          inventory: [{
            quantity: parseInt(productForm.stock_quantity) || 0,
            reorder_point: parseInt(productForm.min_stock_level) || 0
          }]
        };
        
        setProducts(prevProducts => [newProduct, ...prevProducts]);
      }

      setShowProductForm(false);
      setEditingProduct(null);
      resetProductForm();
      
      // Still fetch data in background to ensure consistency
      fetchData();

    } catch (error: any) {
      console.error('Error saving product:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to save product',
        description: error.message || 'An error occurred'
      });
    }
  };

  const resetProductForm = () => {
    setProductForm({
      name: '',
      description: '',
      price: '',
      cost_price: '',
      sku: '',
      brand: '',
      model: '',
      category_id: 'none',
      supplier_id: 'none',
      stock_quantity: '',
      min_stock_level: '',
      is_active: true
    });
    setProductImage(null);
    setImagePreview('');
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      // Get product details before deletion for activity log
      const { data: productToDelete } = await supabase
        .from('products')
        .select('name, sku')
        .eq('id', productId)
        .single();

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      // Create activity log for product deletion
      if (productToDelete) {
        await createActivityLog('product_deleted', {
          product_id: productId,
          product_name: productToDelete.name,
          sku: productToDelete.sku
        });
      }

      toast({
        title: 'Product Deleted! ✅',
        description: 'Product has been removed successfully'
      });

      fetchData();
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to delete product',
        description: error.message || 'An error occurred'
      });
    }
  };

  // Category management functions
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const categoryData = {
        shop_id: shop.id,
        name: categoryForm.name,
        description: categoryForm.description,
        is_active: categoryForm.is_active,
        sort_order: parseInt(categoryForm.sort_order.toString())
      };

      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update(categoryData)
          .eq('id', editingCategory.id);

        if (error) throw error;

        toast({
          title: 'Category Updated! ✅',
          description: 'Category has been updated successfully'
        });
      } else {
        const { error } = await supabase
          .from('categories')
          .insert(categoryData);

        if (error) throw error;

        toast({
          title: 'Category Created! ✅',
          description: 'New category has been added successfully'
        });
      }

      setShowCategoryForm(false);
      setEditingCategory(null);
      resetCategoryForm();
      fetchData();

    } catch (error: any) {
      console.error('Error saving category:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to save category',
        description: error.message || 'An error occurred'
      });
    }
  };

  const resetCategoryForm = () => {
    setCategoryForm({
      name: '',
      description: '',
      is_active: true,
      sort_order: 0
    });
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;

      toast({
        title: 'Category Deleted! ✅',
        description: 'Category has been removed successfully'
      });

      fetchData();
    } catch (error: any) {
      console.error('Error deleting category:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to delete category',
        description: error.message || 'An error occurred'
      });
    }
  };

  // Supplier management functions
  const handleSupplierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const supplierData = {
        shop_id: shop.id,
        name: supplierForm.name,
        contact_person: supplierForm.contact_person,
        email: supplierForm.email,
        phone: supplierForm.phone,
        address: supplierForm.address,
        is_active: supplierForm.is_active
      };

      if (editingSupplier) {
        const { error } = await supabase
          .from('suppliers')
          .update(supplierData)
          .eq('id', editingSupplier.id);

        if (error) throw error;

        toast({
          title: 'Supplier Updated! ✅',
          description: 'Supplier has been updated successfully'
        });
      } else {
        const { error } = await supabase
          .from('suppliers')
          .insert(supplierData);

        if (error) throw error;

        toast({
          title: 'Supplier Created! ✅',
          description: 'New supplier has been added successfully'
        });
      }

      setShowSupplierForm(false);
      setEditingSupplier(null);
      resetSupplierForm();
      fetchData();

    } catch (error: any) {
      console.error('Error saving supplier:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to save supplier',
        description: error.message || 'An error occurred'
      });
    }
  };

  const resetSupplierForm = () => {
    setSupplierForm({
      name: '',
      contact_person: '',
      email: '',
      phone: '',
      address: '',
      is_active: true
    });
  };

  const handleDeleteSupplier = async (supplierId: string) => {
    if (!confirm('Are you sure you want to delete this supplier?')) return;

    try {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', supplierId);

      if (error) throw error;

      toast({
        title: 'Supplier Deleted! ✅',
        description: 'Supplier has been removed successfully'
      });

      fetchData();
    } catch (error: any) {
      console.error('Error deleting supplier:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to delete supplier',
        description: error.message || 'An error occurred'
      });
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-900 via-blue-600 to-indigo-400">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-lg text-white">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 via-blue-600 to-indigo-400">
      {/* Header */}
      <header className="bg-blue-700/20 backdrop-blur-sm border-blue-400/30 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-white">Product Management</h1>
                <p className="text-sm text-blue-100">Manage products, categories & suppliers</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 hover:text-white"
                onClick={() => navigate('/shop-owner-dashboard')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 hover:text-white"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-white/20 backdrop-blur-sm rounded-lg p-1 mb-8">
          <button
            onClick={() => setActiveTab('products')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'products'
                ? 'bg-white text-blue-900 shadow-sm'
                : 'text-white hover:bg-white/10'
            }`}
          >
            <Package className="h-4 w-4 inline mr-2" />
            Products ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'categories'
                ? 'bg-white text-blue-900 shadow-sm'
                : 'text-white hover:bg-white/10'
            }`}
          >
            <FolderOpen className="h-4 w-4 inline mr-2" />
            Categories ({categories.length})
          </button>
                     <button
             onClick={() => setActiveTab('suppliers')}
             className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
               activeTab === 'suppliers'
                 ? 'bg-white text-blue-900 shadow-sm'
                 : 'text-white hover:bg-white/10'
             }`}
           >
             <Truck className="h-4 w-4 inline mr-2" />
             Suppliers ({suppliers.length})
           </button>
           
        </div>

        {/* Content based on active tab */}
        {activeTab === 'products' && (
          <div className="space-y-6">
                         <div className="flex justify-between items-center">
               <h2 className="text-2xl font-bold text-white">Products</h2>
                               <div className="flex space-x-2">
                  <Button
                    onClick={() => setShowProductForm(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                </div>
             </div>

                         {/* Search and Filters */}
             <Card className="bg-white/90 backdrop-blur-sm border-blue-300/50">
               <CardContent className="p-4">
                 <div className="flex space-x-4">
                   <div className="relative flex-1">
                     <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-600" />
                     <Input
                       placeholder="Search products..."
                       value={searchTerm}
                       onChange={(e) => setSearchTerm(e.target.value)}
                       className="pl-10 border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                     />
                   </div>
                                       <Select value={filterCategory} onValueChange={setFilterCategory}>
                      <SelectTrigger className="border-blue-200 focus:border-blue-400 focus:ring-blue-400 w-40">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map(category => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={filterSupplier} onValueChange={setFilterSupplier}>
                      <SelectTrigger className="border-blue-200 focus:border-blue-400 focus:ring-blue-400 w-40">
                        <SelectValue placeholder="Supplier" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Suppliers</SelectItem>
                        {suppliers.map(supplier => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
               </CardContent>
             </Card>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                            {products
                  .filter(product => 
                    (searchTerm === '' || product.name.toLowerCase().includes(searchTerm.toLowerCase())) &&
                    (filterCategory === 'all' || product.category_id === filterCategory) &&
                    (filterSupplier === 'all' || product.supplier_id === filterSupplier)
                  )
                .map((product) => (
                <Card key={product.id} className="bg-white/90 backdrop-blur-sm border-blue-300/50 hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-blue-800 text-base">{product.name}</CardTitle>
                        <CardDescription className="text-blue-600 text-sm line-clamp-2">
                          {product.description}
                        </CardDescription>
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        <Badge variant={product.is_active ? "default" : "secondary"} className="text-xs">
                          {product.is_active ? "Active" : "Inactive"}
                        </Badge>
                        {product.inventory?.[0]?.quantity <= (product.inventory?.[0]?.reorder_point || 0) && (
                          <Badge variant="destructive" className="text-xs">
                            Low Stock
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 px-4 pb-4">
                                                               {/* Product Image */}
                      {product.image_url && (
                        <div className="w-24 h-24 mx-auto bg-gray-100 rounded-lg overflow-hidden">
                          <ProductImage 
                            imageData={product.image_url} 
                            productName={product.name}
                          />
                        </div>
                      )}
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-blue-600">Price:</span>
                        <span className="font-bold text-blue-800">${product.price}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-blue-600">SKU:</span>
                        <span className="font-mono text-blue-800 text-xs">{product.sku}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-blue-600">Stock:</span>
                        <span className={`font-bold ${product.inventory?.[0]?.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {product.inventory?.[0]?.quantity || 0}
                        </span>
                      </div>
                    </div>
                    
                    {/* Stock Progress Bar */}
                    {product.inventory?.[0]?.quantity !== undefined && (
                      <div className="space-y-1">
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div 
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                              (product.inventory[0].quantity || 0) <= (product.inventory[0].reorder_point || 0) 
                                ? 'bg-red-500' 
                                : (product.inventory[0].quantity || 0) <= ((product.inventory[0].reorder_point || 0) * 2)
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                            }`}
                            style={{ 
                              width: `${Math.min(((product.inventory[0].quantity || 0) / Math.max((product.inventory[0].reorder_point || 0) * 3, 1)) * 100, 100)}%` 
                            }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 text-center">
                          {product.inventory[0].reorder_point > 0 ? `Min: ${product.inventory[0].reorder_point}` : 'No min stock set'}
                        </div>
                      </div>
                    )}
                    
                    {product.inventory?.[0]?.reorder_point && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-blue-600">Min:</span>
                        <span className="font-bold text-blue-800">{product.inventory[0].reorder_point}</span>
                      </div>
                    )}
                    
                    {product.brand && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-blue-600">Brand:</span>
                        <span className="font-bold text-blue-800 text-xs">{product.brand}</span>
                      </div>
                    )}
                    
                    <div className="flex space-x-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-100 text-xs py-1"
                        onClick={() => {
                          setEditingProduct(product);
                          setProductForm({
                             name: product.name,
                             description: product.description,
                             price: product.price.toString(),
                             cost_price: product.cost_price.toString(),
                             sku: product.sku,
                             brand: product.brand,
                             model: product.model,
                             category_id: product.category_id || 'none',
                             supplier_id: product.supplier_id || 'none',
                             stock_quantity: product.inventory?.[0]?.quantity?.toString() || '',
                             min_stock_level: product.inventory?.[0]?.reorder_point?.toString() || '',
                             is_active: product.is_active
                           });
                           // For base64 storage, the image_url is already the data URL
                            if (product.image_url) {
                              setImagePreview(product.image_url);
                            } else {
                              setImagePreview('');
                            }
                          setShowProductForm(true);
                        }}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-red-300 text-red-700 hover:bg-red-100 text-xs py-1"
                        onClick={() => handleDeleteProduct(product.id)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Categories</h2>
              <Button
                onClick={() => setShowCategoryForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category) => (
                <Card key={category.id} className="bg-white/90 backdrop-blur-sm border-blue-300/50 hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-blue-800">{category.name}</CardTitle>
                        <CardDescription className="text-blue-600">
                          {category.description}
                        </CardDescription>
                      </div>
                      <Badge variant={category.is_active ? "default" : "secondary"}>
                        {category.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-blue-600 mb-4">
                      Sort Order: {category.sort_order}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-100"
                        onClick={() => {
                          setEditingCategory(category);
                          setCategoryForm({
                            name: category.name,
                            description: category.description,
                            is_active: category.is_active,
                            sort_order: category.sort_order
                          });
                          setShowCategoryForm(true);
                        }}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-red-300 text-red-700 hover:bg-red-100"
                        onClick={() => handleDeleteCategory(category.id)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'suppliers' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Suppliers</h2>
              <Button
                onClick={() => setShowSupplierForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Supplier
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {suppliers.map((supplier) => (
                <Card key={supplier.id} className="bg-white/90 backdrop-blur-sm border-blue-300/50 hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-blue-800">{supplier.name}</CardTitle>
                        <CardDescription className="text-blue-600">
                          {supplier.contact_person}
                        </CardDescription>
                      </div>
                      <Badge variant={supplier.is_active ? "default" : "secondary"}>
                        {supplier.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-sm text-blue-600">
                      <strong>Email:</strong> {supplier.email}
                    </div>
                    <div className="text-sm text-blue-600">
                      <strong>Phone:</strong> {supplier.phone}
                    </div>
                    <div className="text-sm text-blue-600">
                      <strong>Address:</strong> {supplier.address}
                    </div>
                    <div className="flex space-x-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-100"
                        onClick={() => {
                          setEditingSupplier(supplier);
                          setSupplierForm({
                            name: supplier.name,
                            contact_person: supplier.contact_person,
                            email: supplier.email,
                            phone: supplier.phone,
                            address: supplier.address,
                            is_active: supplier.is_active
                          });
                          setShowSupplierForm(true);
                        }}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-red-300 text-red-700 hover:bg-red-100"
                        onClick={() => handleDeleteSupplier(supplier.id)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        
      </div>

      {/* Product Form Modal */}
      {showProductForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-blue-800 mb-4">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h3>
            <form onSubmit={handleProductSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-blue-800">Product Name *</Label>
                  <Input
                    id="name"
                    value={productForm.name}
                    onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                    className="border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku" className="text-blue-800">SKU *</Label>
                  <Input
                    id="sku"
                    value={productForm.sku}
                    onChange={(e) => setProductForm(prev => ({ ...prev, sku: e.target.value }))}
                    required
                    className="border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-blue-800">Description</Label>
                <Textarea
                  id="description"
                  value={productForm.description}
                  onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                  className="border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-blue-800">Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={productForm.price}
                    onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))}
                    required
                    className="border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cost_price" className="text-blue-800">Cost Price *</Label>
                  <Input
                    id="cost_price"
                    type="number"
                    step="0.01"
                    value={productForm.cost_price}
                    onChange={(e) => setProductForm(prev => ({ ...prev, cost_price: e.target.value }))}
                    required
                    className="border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stock_quantity" className="text-blue-800">Stock Quantity</Label>
                  <Input
                    id="stock_quantity"
                    type="number"
                    value={productForm.stock_quantity}
                    onChange={(e) => setProductForm(prev => ({ ...prev, stock_quantity: e.target.value }))}
                    placeholder="Enter stock quantity"
                    className="border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="min_stock_level" className="text-blue-800">Minimum Stock Level</Label>
                  <Input
                    id="min_stock_level"
                    type="number"
                    value={productForm.min_stock_level}
                    onChange={(e) => setProductForm(prev => ({ ...prev, min_stock_level: e.target.value }))}
                    placeholder="Enter minimum stock level"
                    className="border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                  />
                </div>
              </div>

                             <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <Label htmlFor="brand" className="text-blue-800">Brand</Label>
                   <Input
                     id="brand"
                     value={productForm.brand}
                     onChange={(e) => setProductForm(prev => ({ ...prev, brand: e.target.value }))}
                     className="border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                   />
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="model" className="text-blue-800">Model</Label>
                   <Input
                     id="model"
                     value={productForm.model}
                     onChange={(e) => setProductForm(prev => ({ ...prev, model: e.target.value }))}
                     className="border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                   />
                 </div>
               </div>

                                               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category_id" className="text-blue-800">Category (Optional)</Label>
                    <Select value={productForm.category_id || ''} onValueChange={(value) => setProductForm(prev => ({ ...prev, category_id: value }))}>
                      <SelectTrigger className="border-blue-200 focus:border-blue-400 focus:ring-blue-400">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                        <SelectContent>
                         <SelectItem value="none">None</SelectItem>
                         {categories.map(category => (
                           <SelectItem key={category.id} value={category.id}>
                             {category.name}
                           </SelectItem>
                         ))}
                       </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supplier_id" className="text-blue-800">Supplier (Optional)</Label>
                    <Select value={productForm.supplier_id || ''} onValueChange={(value) => setProductForm(prev => ({ ...prev, supplier_id: value }))}>
                      <SelectTrigger className="border-blue-200 focus:border-blue-400 focus:ring-blue-400">
                        <SelectValue placeholder="Select supplier" />
                      </SelectTrigger>
                        <SelectContent>
                         <SelectItem value="none">None</SelectItem>
                         {suppliers.map(supplier => (
                           <SelectItem key={supplier.id} value={supplier.id}>
                             {supplier.name}
                           </SelectItem>
                         ))}
                       </SelectContent>
                    </Select>
                  </div>
                </div>

                             

              

              {/* Image Upload */}
              <div className="space-y-2">
                <Label htmlFor="image" className="text-blue-800">Product Image</Label>
                <div className="space-y-2">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                  />
                  {imagePreview && (
                    <div className="mt-2">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-32 h-32 object-cover rounded-lg border border-blue-200"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Active Status */}
              <div className="flex items-center space-x-2">
                <input
                  id="is_active"
                  type="checkbox"
                  checked={productForm.is_active}
                  onChange={(e) => setProductForm(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-blue-300 rounded"
                />
                <Label htmlFor="is_active" className="text-blue-800">Active</Label>
              </div>

              <div className="flex space-x-2 pt-4">
                <Button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {editingProduct ? 'Update Product' : 'Create Product'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowProductForm(false);
                    setEditingProduct(null);
                    resetProductForm();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Form Modal */}
      {showCategoryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-blue-800 mb-4">
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </h3>
            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cat_name" className="text-blue-800">Category Name *</Label>
                <Input
                  id="cat_name"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className="border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cat_description" className="text-blue-800">Description</Label>
                <Textarea
                  id="cat_description"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                  className="border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cat_sort_order" className="text-blue-800">Sort Order</Label>
                <Input
                  id="cat_sort_order"
                  type="number"
                  value={categoryForm.sort_order}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                  className="border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  id="cat_is_active"
                  type="checkbox"
                  checked={categoryForm.is_active}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-blue-300 rounded"
                />
                <Label htmlFor="cat_is_active" className="text-blue-800">Active</Label>
              </div>

              <div className="flex space-x-2 pt-4">
                <Button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowCategoryForm(false);
                    setEditingCategory(null);
                    resetCategoryForm();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supplier Form Modal */}
      {showSupplierForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-blue-800 mb-4">
              {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
            </h3>
            <form onSubmit={handleSupplierSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="supp_name" className="text-blue-800">Supplier Name *</Label>
                <Input
                  id="supp_name"
                  value={supplierForm.name}
                  onChange={(e) => setSupplierForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className="border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_person" className="text-blue-800">Contact Person *</Label>
                <Input
                  id="contact_person"
                  value={supplierForm.contact_person}
                  onChange={(e) => setSupplierForm(prev => ({ ...prev, contact_person: e.target.value }))}
                  required
                  className="border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="supp_email" className="text-blue-800">Email *</Label>
                  <Input
                    id="supp_email"
                    type="email"
                    value={supplierForm.email}
                    onChange={(e) => setSupplierForm(prev => ({ ...prev, email: e.target.value }))}
                    required
                    className="border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supp_phone" className="text-blue-800">Phone *</Label>
                  <Input
                    id="supp_phone"
                    type="tel"
                    value={supplierForm.phone}
                    onChange={(e) => setSupplierForm(prev => ({ ...prev, phone: e.target.value }))}
                    required
                    className="border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="supp_address" className="text-blue-800">Address</Label>
                <Textarea
                  id="supp_address"
                  value={supplierForm.address}
                  onChange={(e) => setSupplierForm(prev => ({ ...prev, address: e.target.value }))}
                  className="border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  id="supp_is_active"
                  type="checkbox"
                  checked={supplierForm.is_active}
                  onChange={(e) => setSupplierForm(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-blue-300 rounded"
                />
                <Label htmlFor="supp_is_active" className="text-blue-800">Active</Label>
              </div>

              <div className="flex space-x-2 pt-4">
                <Button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {editingSupplier ? 'Update Supplier' : 'Create Supplier'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowSupplierForm(false);
                    setEditingSupplier(null);
                    resetSupplierForm();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
             )}


     </div>
   );
 };

export default ShopOwnerProducts;
