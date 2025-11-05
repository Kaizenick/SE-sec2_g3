// === Updated for Driver ===
import mongoose from "mongoose";

const driverSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  address: { type: String, required: true },
  vehicleType: { type: String, required: true },
  vehicleNumber: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  licenseNumber: { type: String, required: true },
});

export default mongoose.model("Driver", driverSchema);
