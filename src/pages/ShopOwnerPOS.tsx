import React from 'react';
import { useParams } from 'react-router-dom';
import UnifiedPOS from '@/components/common/UnifiedPOS';

const ShopOwnerPOS: React.FC = () => {
  const { shopId } = useParams();

  if (!shopId) {
    return <div>Shop ID not found</div>;
  }

  return <UnifiedPOS userRole="shop_admin" shopId={shopId} />;
};

export default ShopOwnerPOS;
