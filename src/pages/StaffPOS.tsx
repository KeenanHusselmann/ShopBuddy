import { useParams } from "react-router-dom";
import UnifiedPOS from "@/components/common/UnifiedPOS";

const StaffPOS = () => {
  const { shopId } = useParams();

  if (!shopId) {
    return <div>Shop ID not found</div>;
  }

  return <UnifiedPOS userRole="staff" shopId={shopId} />;
};

export default StaffPOS;
