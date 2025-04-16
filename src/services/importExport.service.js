const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");
const ApiError = require("../utils/apiError.util");
const Customer = require("../models/customer.model");
const mongoose = require("mongoose");
const { handleError } = require("../utils/errorHandler");

class ImportExportService {
  /**
   * Process uploaded file
   * @param {Object} file - Uploaded file object
   * @returns {Object} Processed file data
   */
  static async processUploadedFile(file) {
    try {
      const workbook = xlsx.readFile(file.path);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(worksheet);

      if (!data.length) {
        throw new ApiError(400, "File is empty");
      }

      // Use the filename as the file ID
      const fileId = file.filename.split("-")[0];

      // Store the file data in memory or database for later use
      // For now, we'll just return the first few rows as a preview
      return {
        fileId,
        preview: data.slice(0, 5),
        totalRows: data.length,
        headers: Object.keys(data[0]),
      };
    } catch (error) {
      handleError(error);
    }
  }

  /**
   * Get module fields for mapping
   * @param {string} module - Module name
   * @returns {Array} Module fields
   */
  static async getModuleFields(module) {
    try {
      // Normalize module name (convert plural to singular)
      const normalizedModule = module.endsWith("s")
        ? module.slice(0, -1)
        : module;

      // Define fields for each module
      const moduleFields = {
        user: [
          { field: "firstName", label: "First Name", required: true },
          { field: "lastName", label: "Last Name", required: true },
          { field: "email", label: "Email", required: true },
          { field: "phone", label: "Phone", required: false },
          { field: "role", label: "Role", required: true },
          { field: "source", label: "Source", required: false },
          { field: "isActive", label: "Is Active", required: false },
        ],
        customer: [
          { field: "name", label: "Name", required: true },
          { field: "mobile", label: "Mobile", required: true },
          { field: "email", label: "Email", required: false },
          { field: "address", label: "Address", required: true },
          { field: "state", label: "State", required: true },
          { field: "city", label: "City", required: true },
          { field: "village", label: "Village", required: false },
          { field: "pincode", label: "Pincode", required: true },
          { field: "isActive", label: "Is Active", required: false },
          { field: "source", label: "Source", required: false },
        ],
        // Add more modules as needed
      };

      if (!moduleFields[normalizedModule]) {
        throw new ApiError(400, `Invalid module: ${module}`);
      }

      return moduleFields[normalizedModule];
    } catch (error) {
      handleError(error);
    }
  }

  /**
   * Preview data after mapping
   * @param {Object} fileObj - File object with path and originalname
   * @param {Object} mapping - Field mapping
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {Object} Preview data
   */
  static async previewData(fileObj, mapping, page = 1, limit = 5) {
    try {
      const workbook = xlsx.readFile(fileObj.path);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = xlsx.utils.sheet_to_json(worksheet);

      console.log("MAPPING", mapping);

      const dbHeaders = Object.keys(mapping)
        .map((key) => ({
          field: key,
          label: this.getFieldLabel("customer", key), // Assuming customer module for now
        }))
        .filter((header) => header.label); // Filter out unmapped fields

      // Apply mapping to all data
      const mappedData = data.map((row) => {
        const mappedRow = {};
        Object.keys(mapping).forEach((key) => {
          if (mapping[key]) {
            mappedRow[key] = row[mapping[key]];
          }
        });
        return mappedRow;
      });

      // Calculate pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedData = mappedData.slice(startIndex, endIndex);

      return {
        headers: dbHeaders,
        previewData: paginatedData,
        totalRows: mappedData.length,
        currentPage: page,
        totalPages: Math.ceil(mappedData.length / limit),
        hasNextPage: endIndex < mappedData.length,
        hasPrevPage: page > 1,
      };
    } catch (error) {
      handleError(error);
    }
  }

  /**
   * Get field label from module fields
   * @param {string} module - Module name
   * @param {string} field - Field name
   * @returns {string} Field label
   */
  static getFieldLabel(module, field) {
    const moduleFields = {
      customer: [
        { field: "name", label: "Name" },
        { field: "mobile", label: "Mobile" },
        { field: "email", label: "Email" },
        { field: "address", label: "Address" },
        { field: "state", label: "State" },
        { field: "city", label: "City" },
        { field: "village", label: "Village" },
        { field: "pincode", label: "Pincode" },
        { field: "isActive", label: "Is Active" },
        { field: "source", label: "Source" },
      ],
    };

    const fieldDef = moduleFields[module]?.find((f) => f.field === field);
    return fieldDef?.label || field;
  }

  /**
   * Process import
   * @param {string} filePath - File path
   * @param {Object} mapping - Field mapping
   * @param {string} module - Module name
   * @param {string} userId - User ID
   * @returns {Object} Import result
   */
  static async processImport(filePath, mapping, module, userId) {
    try {
      // Normalize module name (convert plural to singular)
      const normalizedModule = module.endsWith("s")
        ? module.slice(0, -1)
        : module;

      const workbook = xlsx.readFile(filePath);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = xlsx.utils.sheet_to_json(worksheet);

      const processedData = data.map((row) => {
        const processedRow = {};
        Object.keys(mapping).forEach((key) => {
          if (mapping[key]) {
            processedRow[key] = row[mapping[key]];
          }
        });
        return processedRow;
      });

      // Set source field for customers
      if (normalizedModule === "customer") {
        processedData.forEach((row) => {
          row.source = "import";
        });
      }

      // Insert data into the appropriate collection
      const collection = mongoose.connection.collection(normalizedModule + "s");
      await collection.insertMany(processedData);

      // Clean up the temporary file
      fs.unlinkSync(filePath);

      return {
        success: true,
        message: `Successfully imported ${processedData.length} records`,
        data: processedData,
      };
    } catch (error) {
      // Clean up the temporary file in case of error
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      throw error;
    }
  }

  /**
   * Export data
   * @param {string} module - Module name
   * @param {string} format - Export format
   * @param {Object} filters - Export filters
   * @param {string} userId - User ID
   * @returns {string} Path to the exported file
   */
  static async exportData(module, format, filters, userId) {
    try {
      // Normalize module name (convert plural to singular)
      const normalizedModule = module.endsWith("s")
        ? module.slice(0, -1)
        : module;

      // TODO: Implement the actual export logic for each module
      // This is a placeholder for demonstration
      let data = [];

      switch (normalizedModule) {
        case "user":
          // Export users logic
          break;
        case "customer":
          // Export customers logic
          const Customer = require("../models/customer.model");
          const query = {};

          // Apply filters if provided
          if (filters) {
            if (filters.search) {
              query.$or = [
                { name: { $regex: filters.search, $options: "i" } },
                { mobile: { $regex: filters.search, $options: "i" } },
                { email: { $regex: filters.search, $options: "i" } },
              ];
            }
            if (filters.state) query.state = filters.state;
            if (filters.city) query.city = filters.city;
            if (filters.isActive !== undefined)
              query.isActive = filters.isActive;
            if (filters.source) query.source = filters.source;
          }

          data = await Customer.find(query);
          break;
        // Add more modules as needed
        default:
          throw new ApiError(400, `Invalid module: ${module}`);
      }

      // Create a workbook and add the data
      const workbook = xlsx.utils.book_new();
      const worksheet = xlsx.utils.json_to_sheet(data);
      xlsx.utils.book_append_sheet(workbook, worksheet, normalizedModule);

      // Generate a unique filename
      const fileName = `${normalizedModule}s_export_${Date.now()}.${format}`;
      const filePath = path.join(__dirname, "../../uploads", fileName);

      // Write the file
      xlsx.writeFile(workbook, filePath);

      return filePath;
    } catch (error) {
      handleError(error);
    }
  }
}

module.exports = ImportExportService;
