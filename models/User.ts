import { model, models, Schema } from "mongoose";

export interface IUser {
  fullName: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: "customer" | "staff" | "admin";
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["customer", "staff", "admin"], default: "customer" }
  },
  { timestamps: true, collection: "users" }
);

export const UserModel = models.User || model<IUser>("User", userSchema);

