const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - role
 *         - name
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated ID of the user
 *         email:
 *           type: string
 *           format: email
 *           description: Email address of the user (unique)
 *         password:
 *           type: string
 *           format: password
 *           description: Hashed password
 *         role:
 *           type: string
 *           enum: [SUPER_ADMIN, SUPPORT_MANAGER, ENGINEER]
 *           description: User role
 *         name:
 *           type: string
 *           description: Full name of the user
 *         mobileNumber:
 *           type: string
 *           description: Mobile number of the user
 *         address:
 *           type: string
 *           description: Full address of the user
 *         location:
 *           type: string
 *           description: Location/area of the user
 *         remark:
 *           type: string
 *           description: Additional remarks about the user
 *         createdBy:
 *           type: string
 *           description: User ID who created this user
 *         isActive:
 *           type: boolean
 *           description: Whether the user is active
 *         lastLogin:
 *           type: string
 *           format: date-time
 *           description: Last login timestamp
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when user was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when user was last updated
 */
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    mobileNumber: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    remark: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpires: {
      type: Date,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const PaginationPlugin = require("../plugins/paginate.plugin");
PaginationPlugin.enhanceSchema(userSchema);

const User = mongoose.model("User", userSchema);

module.exports = User;
