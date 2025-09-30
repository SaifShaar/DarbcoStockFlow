import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { z } from "zod";
import {
  insertWarehouseSchema,
  insertBinSchema,
  insertSupplierSchema,
  insertItemSchema,
  insertBomSchema,
  insertBomLineSchema,
  insertPartsListSchema,
  insertPartsListLineSchema,
  insertRfqSchema,
  insertRfqLineSchema,
  insertQuoteSchema,
  insertQuoteLineSchema,
  insertPurchaseOrderSchema,
  insertPurchaseOrderLineSchema,
  insertGrnSchema,
  insertGrnLineSchema,
  insertWorkOrderSchema,
  insertMinSchema,
  insertMinLineSchema,
  insertMrnSchema,
  insertMrnLineSchema,
  insertDtrSchema,
  insertSettingSchema,
  insertUserSchema,
  updateUserSchema,
  loginSchema,
} from "@shared/schema";

// Helper function to send standardized API responses
function sendResponse(res: any, success: boolean, message: string, data: any = null) {
  res.json({ success, message, data });
}

// Admin authorization middleware
function isAdmin(req: any, res: any, next: any) {
  console.log("isAdmin middleware - req.user:", req.user ? "exists" : "missing");
  
  if (!req.user) {
    console.log("isAdmin middleware - No user in request");
    return sendResponse(res, false, "Unauthorized", null);
  }
  
  const userId = req.user.claims?.sub || req.user.id;
  console.log("isAdmin middleware - userId:", userId);
  
  // For now, we'll check if the user exists and has admin role in the database
  // This is a placeholder - in production, role should be in the JWT token
  storage.getUser(userId).then(user => {
    console.log("isAdmin middleware - Found user:", user ? `${user.email} (role: ${user.role})` : "not found");
    if (!user || user.role !== 'admin') {
      console.log("isAdmin middleware - Access denied. User role:", user?.role || "no user");
      return sendResponse(res, false, "Admin access required", null);
    }
    console.log("isAdmin middleware - Access granted");
    next();
  }).catch(error => {
    console.error("Error checking admin status:", error);
    return sendResponse(res, false, "Authorization error", null);
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const user = await storage.getUser(userId);
      sendResponse(res, true, "User retrieved successfully", user);
    } catch (error) {
      console.error("Error fetching user:", error);
      sendResponse(res, false, "Failed to fetch user", null);
    }
  });

  // Password-based login route
  app.post('/api/auth/login', async (req: any, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      const user = await storage.validateUserPassword(validatedData.email, validatedData.password);
      
      if (!user) {
        return sendResponse(res, false, "Invalid email or password", null);
      }

      // Create a session for the user
      req.session.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        claims: {
          sub: user.id,
          email: user.email,
          first_name: user.firstName,
          last_name: user.lastName,
          role: user.role,
        }
      };

      sendResponse(res, true, "Login successful", {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      });
    } catch (error) {
      console.error("Error during login:", error);
      if (error instanceof z.ZodError) {
        return sendResponse(res, false, "Validation error", error.errors);
      }
      sendResponse(res, false, "Login failed", null);
    }
  });

  // Logout route
  app.post('/api/auth/logout', (req: any, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        return sendResponse(res, false, "Failed to logout", null);
      }
      sendResponse(res, true, "Logout successful", null);
    });
  });

  // User Management routes (Admin only)
  app.get('/api/users', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const users = await storage.getUsers();
      sendResponse(res, true, "Users retrieved successfully", users);
    } catch (error) {
      console.error("Error fetching users:", error);
      sendResponse(res, false, "Failed to fetch users", null);
    }
  });

  app.get('/api/users/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = req.params.id;
      const currentUserId = req.user.claims.sub;
      
      // Allow users to view their own profile, or require admin for others
      if (id !== currentUserId) {
        const currentUser = await storage.getUser(currentUserId);
        if (!currentUser || currentUser.role !== 'admin') {
          return sendResponse(res, false, "Admin access required", null);
        }
      }
      
      const user = await storage.getUser(id);
      if (!user) {
        return sendResponse(res, false, "User not found", null);
      }
      sendResponse(res, true, "User retrieved successfully", user);
    } catch (error) {
      console.error("Error fetching user:", error);
      sendResponse(res, false, "Failed to fetch user", null);
    }
  });

  app.post('/api/users', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(validatedData);
      sendResponse(res, true, "User created successfully", user);
    } catch (error) {
      console.error("Error creating user:", error);
      if (error instanceof z.ZodError) {
        return sendResponse(res, false, "Validation error", error.errors);
      }
      sendResponse(res, false, "Failed to create user", null);
    }
  });

  app.put('/api/users/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const id = req.params.id;
      const validatedData = updateUserSchema.parse(req.body);
      
      // Prevent role elevation unless admin is making the change
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (validatedData.role && currentUser?.role !== 'admin') {
        return sendResponse(res, false, "Only admins can change user roles", null);
      }
      
      const user = await storage.updateUser(id, validatedData);
      if (!user) {
        return sendResponse(res, false, "User not found", null);
      }
      sendResponse(res, true, "User updated successfully", user);
    } catch (error) {
      console.error("Error updating user:", error);
      if (error instanceof z.ZodError) {
        return sendResponse(res, false, "Validation error", error.errors);
      }
      sendResponse(res, false, "Failed to update user", null);
    }
  });

  app.delete('/api/users/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const id = req.params.id;
      const currentUserId = req.user.claims.sub;
      
      // Prevent self-deletion
      if (id === currentUserId) {
        return sendResponse(res, false, "Cannot delete your own account", null);
      }
      
      const deleted = await storage.deleteUser(id);
      if (!deleted) {
        return sendResponse(res, false, "User not found", null);
      }
      sendResponse(res, true, "User deleted successfully", null);
    } catch (error) {
      console.error("Error deleting user:", error);
      sendResponse(res, false, "Failed to delete user", null);
    }
  });

  // Master Data - Warehouses
  app.get('/api/warehouses', isAuthenticated, async (req, res) => {
    try {
      const warehouses = await storage.getWarehouses();
      sendResponse(res, true, "Warehouses retrieved successfully", warehouses);
    } catch (error) {
      console.error("Error fetching warehouses:", error);
      sendResponse(res, false, "Failed to fetch warehouses", null);
    }
  });

  app.get('/api/warehouses/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const warehouse = await storage.getWarehouse(id);
      if (!warehouse) {
        return sendResponse(res, false, "Warehouse not found", null);
      }
      sendResponse(res, true, "Warehouse retrieved successfully", warehouse);
    } catch (error) {
      console.error("Error fetching warehouse:", error);
      sendResponse(res, false, "Failed to fetch warehouse", null);
    }
  });

  app.post('/api/warehouses', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertWarehouseSchema.parse(req.body);
      const warehouse = await storage.createWarehouse(validatedData);
      sendResponse(res, true, "Warehouse created successfully", warehouse);
    } catch (error) {
      console.error("Error creating warehouse:", error);
      if (error instanceof z.ZodError) {
        return sendResponse(res, false, "Validation error", error.errors);
      }
      sendResponse(res, false, "Failed to create warehouse", null);
    }
  });

  app.put('/api/warehouses/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertWarehouseSchema.partial().parse(req.body);
      const warehouse = await storage.updateWarehouse(id, validatedData);
      sendResponse(res, true, "Warehouse updated successfully", warehouse);
    } catch (error) {
      console.error("Error updating warehouse:", error);
      sendResponse(res, false, "Failed to update warehouse", null);
    }
  });

  // Master Data - Bins
  app.get('/api/warehouses/:warehouseId/bins', isAuthenticated, async (req, res) => {
    try {
      const warehouseId = parseInt(req.params.warehouseId);
      const bins = await storage.getBinsByWarehouse(warehouseId);
      sendResponse(res, true, "Bins retrieved successfully", bins);
    } catch (error) {
      console.error("Error fetching bins:", error);
      sendResponse(res, false, "Failed to fetch bins", null);
    }
  });

  app.post('/api/bins', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertBinSchema.parse(req.body);
      const bin = await storage.createBin(validatedData);
      sendResponse(res, true, "Bin created successfully", bin);
    } catch (error) {
      console.error("Error creating bin:", error);
      sendResponse(res, false, "Failed to create bin", null);
    }
  });

  // Master Data - Suppliers
  app.get('/api/suppliers', isAuthenticated, async (req, res) => {
    try {
      const suppliers = await storage.getSuppliers();
      sendResponse(res, true, "Suppliers retrieved successfully", suppliers);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      sendResponse(res, false, "Failed to fetch suppliers", null);
    }
  });

  app.get('/api/suppliers/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const supplier = await storage.getSupplier(id);
      if (!supplier) {
        return sendResponse(res, false, "Supplier not found", null);
      }
      sendResponse(res, true, "Supplier retrieved successfully", supplier);
    } catch (error) {
      console.error("Error fetching supplier:", error);
      sendResponse(res, false, "Failed to fetch supplier", null);
    }
  });

  app.post('/api/suppliers', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertSupplierSchema.parse(req.body);
      const supplier = await storage.createSupplier(validatedData);
      sendResponse(res, true, "Supplier created successfully", supplier);
    } catch (error) {
      console.error("Error creating supplier:", error);
      sendResponse(res, false, "Failed to create supplier", null);
    }
  });

  app.put('/api/suppliers/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertSupplierSchema.partial().parse(req.body);
      const supplier = await storage.updateSupplier(id, validatedData);
      sendResponse(res, true, "Supplier updated successfully", supplier);
    } catch (error) {
      console.error("Error updating supplier:", error);
      sendResponse(res, false, "Failed to update supplier", null);
    }
  });

  // Master Data - Items
  app.get('/api/items', isAuthenticated, async (req, res) => {
    try {
      console.log("GET /api/items - User:", req.user?.email);
      const { search, category, supplierId } = req.query;
      const filters = {
        search: search as string,
        category: category as string,
        supplierId: supplierId ? parseInt(supplierId as string) : undefined,
      };
      console.log("GET /api/items - Filters:", filters);
      const items = await storage.getItems(filters);
      console.log("GET /api/items - Found", items.length, "items");
      sendResponse(res, true, "Items retrieved successfully", items);
    } catch (error) {
      console.error("Error fetching items:", error);
      sendResponse(res, false, "Failed to fetch items", null);
    }
  });

  app.get('/api/items/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const item = await storage.getItem(id);
      if (!item) {
        return sendResponse(res, false, "Item not found", null);
      }
      sendResponse(res, true, "Item retrieved successfully", item);
    } catch (error) {
      console.error("Error fetching item:", error);
      sendResponse(res, false, "Failed to fetch item", null);
    }
  });

  // Helper function to normalize decimal fields to strings for database
  const normalizeItemDecimalFields = (data: any) => ({
    ...data,
    minStock: data.minStock !== null && data.minStock !== undefined ? data.minStock.toString() : null,
    maxStock: data.maxStock !== null && data.maxStock !== undefined ? data.maxStock.toString() : null,
    reorderPoint: data.reorderPoint !== null && data.reorderPoint !== undefined ? data.reorderPoint.toString() : null,
    leadTime: data.leadTime !== null && data.leadTime !== undefined ? data.leadTime : null,
  });

  app.post('/api/items', isAuthenticated, async (req, res) => {
    try {
      console.log("POST /api/items - User:", req.user?.email);
      console.log("POST /api/items - Body:", req.body);
      
      // Validate request data
      const validatedData = insertItemSchema.parse(req.body);
      const itemData = normalizeItemDecimalFields(validatedData);
      
      // Create item in database
      const item = await storage.createItem(itemData);
      console.log("POST /api/items - Created item:", item.id);
      
      // Send response only once
      if (!res.headersSent) {
        sendResponse(res, true, "Item created successfully", item);
      }
    } catch (error) {
      console.error("Error creating item:", error);
      
      // Send error response only if headers not already sent
      if (!res.headersSent) {
        if (error instanceof Error && error.message.includes('validation')) {
          sendResponse(res, false, `Validation error: ${error.message}`, null);
        } else {
          sendResponse(res, false, "Failed to create item", null);
        }
      }
    }
  });

  app.put('/api/items/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertItemSchema.partial().parse(req.body);
      const itemData = normalizeItemDecimalFields(validatedData);
      
      const item = await storage.updateItem(id, itemData);
      sendResponse(res, true, "Item updated successfully", item);
    } catch (error) {
      console.error("Error updating item:", error);
      sendResponse(res, false, "Failed to update item", null);
    }
  });

  // BOMs
  app.get('/api/boms/parent/:parentItemId', isAuthenticated, async (req, res) => {
    try {
      const parentItemId = parseInt(req.params.parentItemId);
      const boms = await storage.getBomsByParentItem(parentItemId);
      sendResponse(res, true, "BOMs retrieved successfully", boms);
    } catch (error) {
      console.error("Error fetching BOMs:", error);
      sendResponse(res, false, "Failed to fetch BOMs", null);
    }
  });

  app.get('/api/boms/:id/active', isAuthenticated, async (req, res) => {
    try {
      const parentItemId = parseInt(req.params.id);
      const bom = await storage.getActiveBom(parentItemId);
      sendResponse(res, true, "Active BOM retrieved successfully", bom);
    } catch (error) {
      console.error("Error fetching active BOM:", error);
      sendResponse(res, false, "Failed to fetch active BOM", null);
    }
  });

  app.post('/api/boms', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertBomSchema.parse(req.body);
      const bom = await storage.createBom(validatedData);
      sendResponse(res, true, "BOM created successfully", bom);
    } catch (error) {
      console.error("Error creating BOM:", error);
      sendResponse(res, false, "Failed to create BOM", null);
    }
  });

  app.put('/api/boms/:id/activate', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { parentItemId } = req.body;
      const bom = await storage.activateBom(id, parentItemId);
      sendResponse(res, true, "BOM activated successfully", bom);
    } catch (error) {
      console.error("Error activating BOM:", error);
      sendResponse(res, false, "Failed to activate BOM", null);
    }
  });

  app.get('/api/boms/:id/lines', isAuthenticated, async (req, res) => {
    try {
      const bomId = parseInt(req.params.id);
      const lines = await storage.getBomLines(bomId);
      sendResponse(res, true, "BOM lines retrieved successfully", lines);
    } catch (error) {
      console.error("Error fetching BOM lines:", error);
      sendResponse(res, false, "Failed to fetch BOM lines", null);
    }
  });

  app.post('/api/bom-lines', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertBomLineSchema.parse(req.body);
      const bomLine = await storage.createBomLine(validatedData);
      sendResponse(res, true, "BOM line created successfully", bomLine);
    } catch (error) {
      console.error("Error creating BOM line:", error);
      sendResponse(res, false, "Failed to create BOM line", null);
    }
  });

  // Parts Lists
  app.get('/api/parts-lists', isAuthenticated, async (req, res) => {
    try {
      const { category, isActive } = req.query;
      const filters = {
        category: category as string,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      };
      const partsLists = await storage.getPartsLists(filters);
      sendResponse(res, true, "Parts lists retrieved successfully", partsLists);
    } catch (error) {
      console.error("Error fetching parts lists:", error);
      sendResponse(res, false, "Failed to fetch parts lists", null);
    }
  });

  app.get('/api/parts-lists/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const partsList = await storage.getPartsList(id);
      if (!partsList) {
        sendResponse(res, false, "Parts list not found", null);
        return;
      }
      sendResponse(res, true, "Parts list retrieved successfully", partsList);
    } catch (error) {
      console.error("Error fetching parts list:", error);
      sendResponse(res, false, "Failed to fetch parts list", null);
    }
  });

  app.post('/api/parts-lists', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Check if user exists in database, if not, set createdBy to null
      let createdBy = null;
      try {
        const user = await storage.getUser(userId);
        if (user) {
          createdBy = userId;
        }
      } catch (error) {
        // User doesn't exist, proceed with null createdBy
        console.log(`User ${userId} not found in database, creating parts list with null createdBy`);
      }
      
      const validatedData = insertPartsListSchema.parse({
        ...req.body,
        createdBy,
      });
      const partsList = await storage.createPartsList(validatedData);
      sendResponse(res, true, "Parts list created successfully", partsList);
    } catch (error) {
      console.error("Error creating parts list:", error);
      sendResponse(res, false, "Failed to create parts list", null);
    }
  });

  app.put('/api/parts-lists/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertPartsListSchema.partial().parse(req.body);
      const partsList = await storage.updatePartsList(id, validatedData);
      sendResponse(res, true, "Parts list updated successfully", partsList);
    } catch (error) {
      console.error("Error updating parts list:", error);
      sendResponse(res, false, "Failed to update parts list", null);
    }
  });

  app.delete('/api/parts-lists/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deletePartsList(id);
      sendResponse(res, true, "Parts list deleted successfully", null);
    } catch (error) {
      console.error("Error deleting parts list:", error);
      sendResponse(res, false, "Failed to delete parts list", null);
    }
  });

  app.get('/api/parts-lists/:id/lines', isAuthenticated, async (req, res) => {
    try {
      const partsListId = parseInt(req.params.id);
      const lines = await storage.getPartsListLines(partsListId);
      sendResponse(res, true, "Parts list lines retrieved successfully", lines);
    } catch (error) {
      console.error("Error fetching parts list lines:", error);
      sendResponse(res, false, "Failed to fetch parts list lines", null);
    }
  });

  app.post('/api/parts-list-lines', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertPartsListLineSchema.parse(req.body);
      const partsListLine = await storage.createPartsListLine(validatedData);
      sendResponse(res, true, "Parts list line created successfully", partsListLine);
    } catch (error) {
      console.error("Error creating parts list line:", error);
      sendResponse(res, false, "Failed to create parts list line", null);
    }
  });

  app.put('/api/parts-list-lines/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertPartsListLineSchema.partial().parse(req.body);
      const partsListLine = await storage.updatePartsListLine(id, validatedData);
      sendResponse(res, true, "Parts list line updated successfully", partsListLine);
    } catch (error) {
      console.error("Error updating parts list line:", error);
      sendResponse(res, false, "Failed to update parts list line", null);
    }
  });

  app.delete('/api/parts-list-lines/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deletePartsListLine(id);
      sendResponse(res, true, "Parts list line deleted successfully", null);
    } catch (error) {
      console.error("Error deleting parts list line:", error);
      sendResponse(res, false, "Failed to delete parts list line", null);
    }
  });

  // RFQs
  app.get('/api/rfqs', isAuthenticated, async (req, res) => {
    try {
      const { status, dateFrom, dateTo } = req.query;
      const filters = {
        status: status as string,
        dateFrom: dateFrom as string,
        dateTo: dateTo as string,
      };
      const rfqs = await storage.getRfqs(filters);
      sendResponse(res, true, "RFQs retrieved successfully", rfqs);
    } catch (error) {
      console.error("Error fetching RFQs:", error);
      sendResponse(res, false, "Failed to fetch RFQs", null);
    }
  });

  app.get('/api/rfqs/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const rfq = await storage.getRfq(id);
      if (!rfq) {
        return sendResponse(res, false, "RFQ not found", null);
      }
      sendResponse(res, true, "RFQ retrieved successfully", rfq);
    } catch (error) {
      console.error("Error fetching RFQ:", error);
      sendResponse(res, false, "Failed to fetch RFQ", null);
    }
  });

  app.post('/api/rfqs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const rfqNumber = await storage.generateSequentialNumber('RFQ');
      const validatedData = insertRfqSchema.parse({
        ...req.body,
        number: rfqNumber,
        createdBy: userId,
      });
      const rfq = await storage.createRfq(validatedData);
      sendResponse(res, true, "RFQ created successfully", rfq);
    } catch (error) {
      console.error("Error creating RFQ:", error);
      sendResponse(res, false, "Failed to create RFQ", null);
    }
  });

  // RFQ Status Transitions
  app.put('/api/rfqs/:id/submit', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const rfq = await storage.updateRfq(id, { 
        status: 'pending',
        updatedAt: new Date()
      });
      sendResponse(res, true, "RFQ submitted successfully", rfq);
    } catch (error) {
      console.error("Error submitting RFQ:", error);
      sendResponse(res, false, "Failed to submit RFQ", null);
    }
  });

  app.put('/api/rfqs/:id/close', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const rfq = await storage.updateRfq(id, { 
        status: 'closed',
        updatedAt: new Date()
      });
      sendResponse(res, true, "RFQ closed successfully", rfq);
    } catch (error) {
      console.error("Error closing RFQ:", error);
      sendResponse(res, false, "Failed to close RFQ", null);
    }
  });

  // RFQ Lines
  app.get('/api/rfqs/:id/lines', isAuthenticated, async (req, res) => {
    try {
      const rfqId = parseInt(req.params.id);
      const rfqLines = await storage.getRfqLines(rfqId);
      sendResponse(res, true, "RFQ lines retrieved successfully", rfqLines);
    } catch (error) {
      console.error("Error fetching RFQ lines:", error);
      sendResponse(res, false, "Failed to fetch RFQ lines", null);
    }
  });

  app.post('/api/rfqs/:id/lines', isAuthenticated, async (req, res) => {
    try {
      const rfqId = parseInt(req.params.id);
      const validatedData = insertRfqLineSchema.parse({
        ...req.body,
        rfqId,
      });
      const rfqLine = await storage.createRfqLine(validatedData);
      sendResponse(res, true, "RFQ line created successfully", rfqLine);
    } catch (error) {
      console.error("Error creating RFQ line:", error);
      sendResponse(res, false, "Failed to create RFQ line", null);
    }
  });

  // Quotes
  app.get('/api/quotes', isAuthenticated, async (req, res) => {
    try {
      const { status, supplierId, rfqId, dateFrom, dateTo } = req.query;
      const filters = {
        status: status as string,
        supplierId: supplierId ? parseInt(supplierId as string) : undefined,
        rfqId: rfqId ? parseInt(rfqId as string) : undefined,
        dateFrom: dateFrom as string,
        dateTo: dateTo as string,
      };
      const quotes = await storage.getQuotes(filters);
      sendResponse(res, true, "Quotes retrieved successfully", quotes);
    } catch (error) {
      console.error("Error fetching quotes:", error);
      sendResponse(res, false, "Failed to fetch quotes", null);
    }
  });

  app.get('/api/quotes/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const quote = await storage.getQuote(id);
      if (!quote) {
        return sendResponse(res, false, "Quote not found", null);
      }
      sendResponse(res, true, "Quote retrieved successfully", quote);
    } catch (error) {
      console.error("Error fetching quote:", error);
      sendResponse(res, false, "Failed to fetch quote", null);
    }
  });

  app.post('/api/quotes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const quoteNumber = await storage.generateSequentialNumber('QUOTE');
      const validatedData = insertQuoteSchema.parse({
        ...req.body,
        number: quoteNumber,
        createdBy: userId,
      });
      const quote = await storage.createQuote(validatedData);
      sendResponse(res, true, "Quote created successfully", quote);
    } catch (error) {
      console.error("Error creating quote:", error);
      if (error instanceof z.ZodError) {
        return sendResponse(res, false, "Validation error", error.errors);
      }
      sendResponse(res, false, "Failed to create quote", null);
    }
  });

  app.put('/api/quotes/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertQuoteSchema.partial().parse(req.body);
      const quote = await storage.updateQuote(id, validatedData);
      sendResponse(res, true, "Quote updated successfully", quote);
    } catch (error) {
      console.error("Error updating quote:", error);
      sendResponse(res, false, "Failed to update quote", null);
    }
  });

  // Quote Lines
  app.get('/api/quotes/:id/lines', isAuthenticated, async (req, res) => {
    try {
      const quoteId = parseInt(req.params.id);
      const quoteLines = await storage.getQuoteLines(quoteId);
      sendResponse(res, true, "Quote lines retrieved successfully", quoteLines);
    } catch (error) {
      console.error("Error fetching quote lines:", error);
      sendResponse(res, false, "Failed to fetch quote lines", null);
    }
  });

  app.post('/api/quotes/:id/lines', isAuthenticated, async (req, res) => {
    try {
      const quoteId = parseInt(req.params.id);
      const validatedData = insertQuoteLineSchema.parse({
        ...req.body,
        quoteId,
      });
      const quoteLine = await storage.createQuoteLine(validatedData);
      sendResponse(res, true, "Quote line created successfully", quoteLine);
    } catch (error) {
      console.error("Error creating quote line:", error);
      sendResponse(res, false, "Failed to create quote line", null);
    }
  });

  // RFQ to Quote conversion
  app.post('/api/rfqs/:id/convert-to-quote', isAuthenticated, async (req: any, res) => {
    try {
      const rfqId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const { supplierId, validUntil, totalAmount, vatRate = 16 } = req.body;
      
      // Get RFQ details
      const rfq = await storage.getRfq(rfqId);
      if (!rfq) {
        return sendResponse(res, false, "RFQ not found", null);
      }
      
      // Create quote from RFQ
      const quoteNumber = await storage.generateSequentialNumber('QUOTE');
      const vatAmount = (totalAmount * vatRate) / 100;
      const grandTotal = totalAmount + vatAmount;
      
      const quote = await storage.createQuote({
        quoteNumber: quoteNumber,
        rfqId: rfqId,
        supplierId: supplierId,
        quoteDate: new Date().toISOString().split('T')[0],
        validUntil: validUntil,
        currency: 'JOD',
        totalAmount: grandTotal.toString(),
        status: 'draft',
        createdBy: userId,
      });
      
      sendResponse(res, true, "Quote created from RFQ successfully", quote);
    } catch (error) {
      console.error("Error converting RFQ to quote:", error);
      sendResponse(res, false, "Failed to convert RFQ to quote", null);
    }
  });

  // Quote to PO conversion
  app.post('/api/quotes/:id/convert-to-po', isAuthenticated, async (req: any, res) => {
    try {
      const quoteId = parseInt(req.params.id);
      const { orderDate, deliveryDate, paymentTerms, deliveryTerms } = req.body;
      const userId = req.user.claims.sub;

      // Get the quote
      const quote = await storage.getQuote(quoteId);
      if (!quote) {
        return sendResponse(res, false, "Quote not found", null);
      }

      // Validate quote can be converted
      if (quote.status !== 'approved') {
        return sendResponse(res, false, "Only approved quotes can be converted to purchase orders", null);
      }

      // Create PO from quote
      const poNumber = await storage.generateSequentialNumber('PO');
      
      // Calculate VAT breakdown (16% VAT rate for Jordan)
      const vatRate = 16;
      const totalAmount = parseFloat(quote.totalAmount || '0');
      const subtotal = totalAmount / (1 + vatRate / 100);
      const vatAmount = totalAmount - subtotal;
      
      const po = await storage.createPurchaseOrder({
        number: poNumber,
        supplierId: quote.supplierId,
        orderDate: orderDate,
        deliveryDate: deliveryDate,
        currency: quote.currency || 'JOD',
        subtotal: subtotal.toFixed(2),
        vatRate: vatRate.toString(),
        vatAmount: vatAmount.toFixed(2),
        totalAmount: quote.totalAmount,
        paymentTerms: paymentTerms,
        deliveryTerms: deliveryTerms,
        status: 'pending',
        createdBy: userId,
      });

      // Update quote status to converted
      await storage.updateQuote(quoteId, { 
        status: 'converted',
        updatedAt: new Date()
      });

      sendResponse(res, true, "Purchase order created from quote successfully", { po, quote });
    } catch (error) {
      console.error("Error converting quote to PO:", error);
      sendResponse(res, false, "Failed to convert quote to purchase order", null);
    }
  });

  // Purchase Orders
  app.get('/api/purchase-orders', isAuthenticated, async (req, res) => {
    try {
      const { status, supplierId, dateFrom, dateTo } = req.query;
      const filters = {
        status: status as string,
        supplierId: supplierId ? parseInt(supplierId as string) : undefined,
        dateFrom: dateFrom as string,
        dateTo: dateTo as string,
      };
      const pos = await storage.getPurchaseOrders(filters);
      sendResponse(res, true, "Purchase orders retrieved successfully", pos);
    } catch (error) {
      console.error("Error fetching purchase orders:", error);
      sendResponse(res, false, "Failed to fetch purchase orders", null);
    }
  });

  app.get('/api/purchase-orders/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const po = await storage.getPurchaseOrder(id);
      if (!po) {
        return sendResponse(res, false, "Purchase order not found", null);
      }
      sendResponse(res, true, "Purchase order retrieved successfully", po);
    } catch (error) {
      console.error("Error fetching purchase order:", error);
      sendResponse(res, false, "Failed to fetch purchase order", null);
    }
  });

  app.post('/api/purchase-orders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const poNumber = await storage.generateSequentialNumber('PO');
      const validatedData = insertPurchaseOrderSchema.parse({
        ...req.body,
        number: poNumber,
        createdBy: userId,
      });
      const po = await storage.createPurchaseOrder(validatedData);
      sendResponse(res, true, "Purchase order created successfully", po);
    } catch (error) {
      console.error("Error creating purchase order:", error);
      sendResponse(res, false, "Failed to create purchase order", null);
    }
  });

  app.put('/api/purchase-orders/:id/submit', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const po = await storage.updatePurchaseOrder(id, { 
        status: 'pending',
        updatedAt: new Date()
      });
      sendResponse(res, true, "Purchase order submitted for approval successfully", po);
    } catch (error) {
      console.error("Error submitting purchase order:", error);
      sendResponse(res, false, "Failed to submit purchase order", null);
    }
  });

  app.put('/api/purchase-orders/:id/approve', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const po = await storage.approvePurchaseOrder(id, userId);
      sendResponse(res, true, "Purchase order approved successfully", po);
    } catch (error) {
      console.error("Error approving purchase order:", error);
      sendResponse(res, false, "Failed to approve purchase order", null);
    }
  });

  app.put('/api/purchase-orders/:id/reject', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { reason } = req.body;
      const po = await storage.updatePurchaseOrder(id, { 
        status: 'rejected',
        notes: reason,
        updatedAt: new Date()
      });
      sendResponse(res, true, "Purchase order rejected successfully", po);
    } catch (error) {
      console.error("Error rejecting purchase order:", error);
      sendResponse(res, false, "Failed to reject purchase order", null);
    }
  });

  // Purchase Order Lines
  app.get('/api/purchase-orders/:id/lines', isAuthenticated, async (req, res) => {
    try {
      const poId = parseInt(req.params.id);
      const poLines = await storage.getPurchaseOrderLines(poId);
      sendResponse(res, true, "Purchase order lines retrieved successfully", poLines);
    } catch (error) {
      console.error("Error fetching purchase order lines:", error);
      sendResponse(res, false, "Failed to fetch purchase order lines", null);
    }
  });

  app.post('/api/purchase-orders/:id/lines', isAuthenticated, async (req, res) => {
    try {
      const poId = parseInt(req.params.id);
      const validatedData = insertPurchaseOrderLineSchema.parse({
        ...req.body,
        poId,
      });
      const poLine = await storage.createPurchaseOrderLine(validatedData);
      sendResponse(res, true, "Purchase order line created successfully", poLine);
    } catch (error) {
      console.error("Error creating purchase order line:", error);
      sendResponse(res, false, "Failed to create purchase order line", null);
    }
  });

  app.put('/api/purchase-orders/:poId/lines/:lineId', isAuthenticated, async (req, res) => {
    try {
      const lineId = parseInt(req.params.lineId);
      const validatedData = insertPurchaseOrderLineSchema.partial().parse(req.body);
      const poLine = await storage.updatePurchaseOrderLine(lineId, validatedData);
      sendResponse(res, true, "Purchase order line updated successfully", poLine);
    } catch (error) {
      console.error("Error updating purchase order line:", error);
      sendResponse(res, false, "Failed to update purchase order line", null);
    }
  });

  app.delete('/api/purchase-orders/:poId/lines/:lineId', isAuthenticated, async (req, res) => {
    try {
      const lineId = parseInt(req.params.lineId);
      await storage.deletePurchaseOrderLine(lineId);
      sendResponse(res, true, "Purchase order line deleted successfully", null);
    } catch (error) {
      console.error("Error deleting purchase order line:", error);
      sendResponse(res, false, "Failed to delete purchase order line", null);
    }
  });

  // GRN Lines
  app.get('/api/grns/:id/lines', isAuthenticated, async (req, res) => {
    try {
      const grnId = parseInt(req.params.id);
      const grnLines = await storage.getGrnLines(grnId);
      sendResponse(res, true, "GRN lines retrieved successfully", grnLines);
    } catch (error) {
      console.error("Error fetching GRN lines:", error);
      sendResponse(res, false, "Failed to fetch GRN lines", null);
    }
  });

  app.post('/api/grn-lines', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertGrnLineSchema.parse(req.body);
      const grnLine = await storage.createGrnLine(validatedData);
      sendResponse(res, true, "GRN line created successfully", grnLine);
    } catch (error) {
      console.error("Error creating GRN line:", error);
      sendResponse(res, false, "Failed to create GRN line", null);
    }
  });

  app.put('/api/grn-lines/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertGrnLineSchema.partial().parse(req.body);
      const grnLine = await storage.updateGrnLine(id, validatedData);
      sendResponse(res, true, "GRN line updated successfully", grnLine);
    } catch (error) {
      console.error("Error updating GRN line:", error);
      sendResponse(res, false, "Failed to update GRN line", null);
    }
  });

  app.delete('/api/grn-lines/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteGrnLine(id);
      sendResponse(res, true, "GRN line deleted successfully", null);
    } catch (error) {
      console.error("Error deleting GRN line:", error);
      sendResponse(res, false, "Failed to delete GRN line", null);
    }
  });

  // GRNs
  app.get('/api/grns', isAuthenticated, async (req, res) => {
    try {
      const { status, warehouseId, dateFrom, dateTo } = req.query;
      const filters = {
        status: status as string,
        warehouseId: warehouseId ? parseInt(warehouseId as string) : undefined,
        dateFrom: dateFrom as string,
        dateTo: dateTo as string,
      };
      const grns = await storage.getGrns(filters);
      sendResponse(res, true, "GRNs retrieved successfully", grns);
    } catch (error) {
      console.error("Error fetching GRNs:", error);
      sendResponse(res, false, "Failed to fetch GRNs", null);
    }
  });

  app.post('/api/grns', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const grnNumber = await storage.generateSequentialNumber('GRN');
      const { lines, ...grnData } = req.body;
      
      const validatedData = insertGrnSchema.parse({
        ...grnData,
        number: grnNumber,
        receivedBy: userId,
      });
      
      // Process GRN with stock updates if lines provided
      if (lines && lines.length > 0) {
        console.log("Creating GRN with", lines.length, "lines and stock updates");
        const grn = await storage.processGrnWithStockUpdate(validatedData, lines);
        sendResponse(res, true, "GRN created successfully with stock updates", grn);
      } else {
        // Fallback to basic creation if no lines
        const grn = await storage.createGrn(validatedData);
        sendResponse(res, true, "GRN created successfully", grn);
      }
    } catch (error) {
      console.error("Error creating GRN:", error);
      sendResponse(res, false, "Failed to create GRN", null);
    }
  });

  // Work Orders
  app.get('/api/work-orders', isAuthenticated, async (req, res) => {
    try {
      const { status, itemId, dateFrom, dateTo } = req.query;
      const filters = {
        status: status as string,
        itemId: itemId ? parseInt(itemId as string) : undefined,
        dateFrom: dateFrom as string,
        dateTo: dateTo as string,
      };
      const wos = await storage.getWorkOrders(filters);
      sendResponse(res, true, "Work orders retrieved successfully", wos);
    } catch (error) {
      console.error("Error fetching work orders:", error);
      sendResponse(res, false, "Failed to fetch work orders", null);
    }
  });

  app.post('/api/work-orders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const woNumber = await storage.generateSequentialNumber('WO');
      const validatedData = insertWorkOrderSchema.parse({
        ...req.body,
        number: woNumber,
        createdBy: userId,
      });
      const wo = await storage.createWorkOrder(validatedData);
      sendResponse(res, true, "Work order created successfully", wo);
    } catch (error) {
      console.error("Error creating work order:", error);
      sendResponse(res, false, "Failed to create work order", null);
    }
  });

  app.put('/api/work-orders/:id/release', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const wo = await storage.releaseWorkOrder(id, userId);
      sendResponse(res, true, "Work order released successfully", wo);
    } catch (error) {
      console.error("Error releasing work order:", error);
      sendResponse(res, false, "Failed to release work order", null);
    }
  });

  // MIN Lines
  app.get('/api/mins/:id/lines', isAuthenticated, async (req, res) => {
    try {
      const minId = parseInt(req.params.id);
      const minLines = await storage.getMinLines(minId);
      sendResponse(res, true, "MIN lines retrieved successfully", minLines);
    } catch (error) {
      console.error("Error fetching MIN lines:", error);
      sendResponse(res, false, "Failed to fetch MIN lines", null);
    }
  });

  app.post('/api/min-lines', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertMinLineSchema.parse(req.body);
      const minLine = await storage.createMinLine(validatedData);
      sendResponse(res, true, "MIN line created successfully", minLine);
    } catch (error) {
      console.error("Error creating MIN line:", error);
      sendResponse(res, false, "Failed to create MIN line", null);
    }
  });

  app.put('/api/min-lines/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertMinLineSchema.partial().parse(req.body);
      const minLine = await storage.updateMinLine(id, validatedData);
      sendResponse(res, true, "MIN line updated successfully", minLine);
    } catch (error) {
      console.error("Error updating MIN line:", error);
      sendResponse(res, false, "Failed to update MIN line", null);
    }
  });

  app.delete('/api/min-lines/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteMinLine(id);
      sendResponse(res, true, "MIN line deleted successfully", null);
    } catch (error) {
      console.error("Error deleting MIN line:", error);
      sendResponse(res, false, "Failed to delete MIN line", null);
    }
  });

  // MINs
  app.get('/api/mins', isAuthenticated, async (req, res) => {
    try {
      const { status, warehouseId, workOrderId, dateFrom, dateTo } = req.query;
      const filters = {
        status: status as string,
        warehouseId: warehouseId ? parseInt(warehouseId as string) : undefined,
        workOrderId: workOrderId ? parseInt(workOrderId as string) : undefined,
        dateFrom: dateFrom as string,
        dateTo: dateTo as string,
      };
      const mins = await storage.getMins(filters);
      sendResponse(res, true, "MINs retrieved successfully", mins);
    } catch (error) {
      console.error("Error fetching MINs:", error);
      sendResponse(res, false, "Failed to fetch MINs", null);
    }
  });

  app.post('/api/mins', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const minNumber = await storage.generateSequentialNumber('MIN');
      const { lines, ...minData } = req.body;
      
      const validatedData = insertMinSchema.parse({
        ...minData,
        number: minNumber,
        requestedBy: userId,
      });
      
      // Process MIN with stock updates if lines provided
      if (lines && lines.length > 0) {
        console.log("Creating MIN with", lines.length, "lines and stock updates");
        const min = await storage.processMinWithStockUpdate(validatedData, lines);
        sendResponse(res, true, "MIN created successfully with stock updates", min);
      } else {
        // Fallback to basic creation if no lines
        const min = await storage.createMin(validatedData);
        sendResponse(res, true, "MIN created successfully", min);
      }
    } catch (error) {
      console.error("Error creating MIN:", error);
      sendResponse(res, false, "Failed to create MIN", null);
    }
  });

  // MRN Lines
  app.get('/api/mrns/:id/lines', isAuthenticated, async (req, res) => {
    try {
      const mrnId = parseInt(req.params.id);
      const mrnLines = await storage.getMrnLines(mrnId);
      sendResponse(res, true, "MRN lines retrieved successfully", mrnLines);
    } catch (error) {
      console.error("Error fetching MRN lines:", error);
      sendResponse(res, false, "Failed to fetch MRN lines", null);
    }
  });

  app.post('/api/mrn-lines', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertMrnLineSchema.parse(req.body);
      const mrnLine = await storage.createMrnLine(validatedData);
      sendResponse(res, true, "MRN line created successfully", mrnLine);
    } catch (error) {
      console.error("Error creating MRN line:", error);
      sendResponse(res, false, "Failed to create MRN line", null);
    }
  });

  app.put('/api/mrn-lines/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertMrnLineSchema.partial().parse(req.body);
      const mrnLine = await storage.updateMrnLine(id, validatedData);
      sendResponse(res, true, "MRN line updated successfully", mrnLine);
    } catch (error) {
      console.error("Error updating MRN line:", error);
      sendResponse(res, false, "Failed to update MRN line", null);
    }
  });

  app.delete('/api/mrn-lines/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteMrnLine(id);
      sendResponse(res, true, "MRN line deleted successfully", null);
    } catch (error) {
      console.error("Error deleting MRN line:", error);
      sendResponse(res, false, "Failed to delete MRN line", null);
    }
  });

  // MRNs
  app.get('/api/mrns', isAuthenticated, async (req, res) => {
    try {
      const { status, warehouseId, dateFrom, dateTo } = req.query;
      const filters = {
        status: status as string,
        warehouseId: warehouseId ? parseInt(warehouseId as string) : undefined,
        dateFrom: dateFrom as string,
        dateTo: dateTo as string,
      };
      const mrns = await storage.getMrns(filters);
      sendResponse(res, true, "MRNs retrieved successfully", mrns);
    } catch (error) {
      console.error("Error fetching MRNs:", error);
      sendResponse(res, false, "Failed to fetch MRNs", null);
    }
  });

  app.post('/api/mrns', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const mrnNumber = await storage.generateSequentialNumber('MRN');
      const { lines, ...mrnData } = req.body;
      
      const validatedData = insertMrnSchema.parse({
        ...mrnData,
        number: mrnNumber,
        returnedBy: userId,
      });
      
      // Process MRN with stock updates if lines provided
      if (lines && lines.length > 0) {
        console.log("Creating MRN with", lines.length, "lines and stock updates");
        const mrn = await storage.processMrnWithStockUpdate(validatedData, lines);
        sendResponse(res, true, "MRN created successfully with stock updates", mrn);
      } else {
        // Fallback to basic creation if no lines
        const mrn = await storage.createMrn(validatedData);
        sendResponse(res, true, "MRN created successfully", mrn);
      }
    } catch (error) {
      console.error("Error creating MRN:", error);
      sendResponse(res, false, "Failed to create MRN", null);
    }
  });

  // DTR
  app.get('/api/dtr', isAuthenticated, async (req, res) => {
    try {
      const { itemId, warehouseId, transactionType, dateFrom, dateTo, workOrderId } = req.query;
      const filters = {
        itemId: itemId ? parseInt(itemId as string) : undefined,
        warehouseId: warehouseId ? parseInt(warehouseId as string) : undefined,
        transactionType: transactionType as string,
        dateFrom: dateFrom as string,
        dateTo: dateTo as string,
        workOrderId: workOrderId ? parseInt(workOrderId as string) : undefined,
      };
      const dtrEntries = await storage.getDtrEntries(filters);
      sendResponse(res, true, "DTR entries retrieved successfully", dtrEntries);
    } catch (error) {
      console.error("Error fetching DTR entries:", error);
      sendResponse(res, false, "Failed to fetch DTR entries", null);
    }
  });

  // Stock Levels
  app.get('/api/stock-levels', isAuthenticated, async (req, res) => {
    try {
      const { itemId, warehouseId, binId } = req.query;
      const filters = {
        itemId: itemId ? parseInt(itemId as string) : undefined,
        warehouseId: warehouseId ? parseInt(warehouseId as string) : undefined,
        binId: binId ? parseInt(binId as string) : undefined,
      };
      const stockLevels = await storage.getStockLevels(filters);
      sendResponse(res, true, "Stock levels retrieved successfully", stockLevels);
    } catch (error) {
      console.error("Error fetching stock levels:", error);
      sendResponse(res, false, "Failed to fetch stock levels", null);
    }
  });

  // Settings
  app.get('/api/settings', isAuthenticated, async (req, res) => {
    try {
      const settings = await storage.getSettings();
      sendResponse(res, true, "Settings retrieved successfully", settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      sendResponse(res, false, "Failed to fetch settings", null);
    }
  });

  app.put('/api/settings/:key', isAuthenticated, async (req: any, res) => {
    try {
      const key = req.params.key;
      const { value } = req.body;
      const userId = req.user.claims.sub;
      const setting = await storage.updateSetting(key, value, userId);
      sendResponse(res, true, "Setting updated successfully", setting);
    } catch (error) {
      console.error("Error updating setting:", error);
      sendResponse(res, false, "Failed to update setting", null);
    }
  });

  // Stock Levels API
  app.get('/api/stock-levels', isAuthenticated, async (req, res) => {
    try {
      const { itemId, warehouseId, binId } = req.query;
      const filters = {
        itemId: itemId ? parseInt(itemId as string) : undefined,
        warehouseId: warehouseId ? parseInt(warehouseId as string) : undefined,
        binId: binId ? parseInt(binId as string) : undefined,
      };
      console.log("GET /api/stock-levels - Filters:", filters);
      const stockLevels = await storage.getStockLevels(filters);
      console.log("GET /api/stock-levels - Found", stockLevels.length, "stock records");
      sendResponse(res, true, "Stock levels retrieved successfully", stockLevels);
    } catch (error) {
      console.error("Error fetching stock levels:", error);
      sendResponse(res, false, "Failed to fetch stock levels", null);
    }
  });

  // Lookup endpoints for typeahead/search
  app.get('/api/lookup/items', isAuthenticated, async (req, res) => {
    try {
      const { search } = req.query;
      const items = await storage.getItems({ search: search as string });
      const lookupData = items.map(item => ({
        id: item.id,
        code: item.code,
        name: item.name,
        nameAr: item.nameAr,
        uom: item.uom,
      }));
      sendResponse(res, true, "Item lookup data retrieved successfully", lookupData);
    } catch (error) {
      console.error("Error fetching item lookup:", error);
      sendResponse(res, false, "Failed to fetch item lookup data", null);
    }
  });

  app.get('/api/lookup/suppliers', isAuthenticated, async (req, res) => {
    try {
      const suppliers = await storage.getSuppliers();
      const lookupData = suppliers.map(supplier => ({
        id: supplier.id,
        code: supplier.code,
        name: supplier.name,
        nameAr: supplier.nameAr,
      }));
      sendResponse(res, true, "Supplier lookup data retrieved successfully", lookupData);
    } catch (error) {
      console.error("Error fetching supplier lookup:", error);
      sendResponse(res, false, "Failed to fetch supplier lookup data", null);
    }
  });

  // Dashboard metrics
  app.get('/api/dashboard/metrics', isAuthenticated, async (req, res) => {
    try {
      // Get pending approvals count
      const pendingPOs = await storage.getPurchaseOrders({ status: 'pending' });
      const pendingApprovals = pendingPOs.length;

      // Get below minimum stock items
      const stockLevels = await storage.getStockLevels();
      const items = await storage.getItems();
      let belowMinStock = 0;
      for (const stock of stockLevels) {
        const item = items.find(i => i.id === stock.itemId);
        if (item && item.minStock && parseFloat(stock.quantity) < parseFloat(item.minStock)) {
          belowMinStock++;
        }
      }

      // Get today's receipts
      const today = new Date().toISOString().split('T')[0];
      const todayGrns = await storage.getGrns({ dateFrom: today, dateTo: today });
      const todaysReceipts = todayGrns.length;

      // Get active work orders
      const activeWOs = await storage.getWorkOrders({ status: 'in_progress' });
      const activeWorkOrders = activeWOs.length;

      const metrics = {
        pendingApprovals,
        belowMinStock,
        todaysReceipts,
        activeWorkOrders,
      };

      sendResponse(res, true, "Dashboard metrics retrieved successfully", metrics);
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      sendResponse(res, false, "Failed to fetch dashboard metrics", null);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
