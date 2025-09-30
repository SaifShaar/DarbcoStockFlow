import {
  users,
  warehouses,
  bins,
  suppliers,
  items,
  boms,
  bomLines,
  rfqs,
  rfqLines,
  quotes,
  quoteLines,
  purchaseOrders,
  purchaseOrderLines,
  grns,
  grnLines,
  workOrders,
  mins,
  minLines,
  mrns,
  mrnLines,
  transfers,
  transferLines,
  adjustments,
  adjustmentLines,
  partsLists,
  partsListLines,
  dtr,
  stockLevels,
  settings,
  type User,
  type UpsertUser,
  type Warehouse,
  type InsertWarehouse,
  type Bin,
  type InsertBin,
  type Supplier,
  type InsertSupplier,
  type Item,
  type InsertItem,
  type Bom,
  type InsertBom,
  type BomLine,
  type InsertBomLine,
  type Rfq,
  type InsertRfq,
  type RfqLine,
  type InsertRfqLine,
  type Quote,
  type InsertQuote,
  type QuoteLine,
  type InsertQuoteLine,
  type PurchaseOrder,
  type InsertPurchaseOrder,
  type PurchaseOrderLine,
  type InsertPurchaseOrderLine,
  type Grn,
  type InsertGrn,
  type GrnLine,
  type InsertGrnLine,
  type WorkOrder,
  type InsertWorkOrder,
  type Min,
  type InsertMin,
  type MinLine,
  type InsertMinLine,
  type Mrn,
  type InsertMrn,
  type MrnLine,
  type InsertMrnLine,
  type PartsList,
  type InsertPartsList,
  type PartsListLine,
  type InsertPartsListLine,
  type Dtr,
  type InsertDtr,
  type StockLevel,
  type InsertStockLevel,
  type Setting,
  type InsertSetting,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, like, gte, lte, inArray, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  createUser(userData: Omit<UpsertUser, 'id'>): Promise<User>;
  updateUser(id: string, userData: Partial<UpsertUser>): Promise<User | null>;
  deleteUser(id: string): Promise<boolean>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Password-based authentication
  getUserByEmail(email: string): Promise<User | undefined>;
  validateUserPassword(email: string, password: string): Promise<User | null>;
  setUserPassword(userId: string, password: string): Promise<boolean>;

  // Master Data
  // Warehouses
  getWarehouses(): Promise<Warehouse[]>;
  getWarehouse(id: number): Promise<Warehouse | undefined>;
  createWarehouse(warehouse: InsertWarehouse): Promise<Warehouse>;
  updateWarehouse(id: number, warehouse: Partial<InsertWarehouse>): Promise<Warehouse>;
  deleteWarehouse(id: number): Promise<void>;

  // Bins
  getBinsByWarehouse(warehouseId: number): Promise<Bin[]>;
  getBin(id: number): Promise<Bin | undefined>;
  createBin(bin: InsertBin): Promise<Bin>;
  updateBin(id: number, bin: Partial<InsertBin>): Promise<Bin>;
  deleteBin(id: number): Promise<void>;

  // Suppliers
  getSuppliers(): Promise<Supplier[]>;
  getSupplier(id: number): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: number, supplier: Partial<InsertSupplier>): Promise<Supplier>;
  deleteSupplier(id: number): Promise<void>;

  // Items
  getItems(filters?: { search?: string; category?: string; supplierId?: number }): Promise<Item[]>;
  getItem(id: number): Promise<Item | undefined>;
  getItemByCode(code: string): Promise<Item | undefined>;
  createItem(item: InsertItem): Promise<Item>;
  updateItem(id: number, item: Partial<InsertItem>): Promise<Item>;
  deleteItem(id: number): Promise<void>;

  // BOMs
  getBomsByParentItem(parentItemId: number): Promise<Bom[]>;
  getActiveBom(parentItemId: number): Promise<Bom | undefined>;
  getBom(id: number): Promise<Bom | undefined>;
  createBom(bom: InsertBom): Promise<Bom>;
  updateBom(id: number, bom: Partial<InsertBom>): Promise<Bom>;
  activateBom(id: number, parentItemId: number): Promise<Bom>;
  getBomLines(bomId: number): Promise<BomLine[]>;
  createBomLine(bomLine: InsertBomLine): Promise<BomLine>;
  updateBomLine(id: number, bomLine: Partial<InsertBomLine>): Promise<BomLine>;
  deleteBomLine(id: number): Promise<void>;

  // Procurement
  // RFQs
  getRfqs(filters?: { status?: string; dateFrom?: string; dateTo?: string }): Promise<Rfq[]>;
  getRfq(id: number): Promise<Rfq | undefined>;
  createRfq(rfq: InsertRfq): Promise<Rfq>;
  updateRfq(id: number, rfq: Partial<InsertRfq>): Promise<Rfq>;
  getRfqLines(rfqId: number): Promise<RfqLine[]>;
  createRfqLine(rfqLine: InsertRfqLine): Promise<RfqLine>;
  updateRfqLine(id: number, rfqLine: Partial<InsertRfqLine>): Promise<RfqLine>;
  deleteRfqLine(id: number): Promise<void>;

  // Quotes
  getQuotes(filters?: { status?: string; supplierId?: number; rfqId?: number; dateFrom?: string; dateTo?: string }): Promise<Quote[]>;
  getQuotesByRfq(rfqId: number): Promise<Quote[]>;
  getQuote(id: number): Promise<Quote | undefined>;
  createQuote(quote: InsertQuote): Promise<Quote>;
  updateQuote(id: number, quote: Partial<InsertQuote>): Promise<Quote>;
  getQuoteLines(quoteId: number): Promise<QuoteLine[]>;
  createQuoteLine(quoteLine: InsertQuoteLine): Promise<QuoteLine>;
  updateQuoteLine(id: number, quoteLine: Partial<InsertQuoteLine>): Promise<QuoteLine>;
  deleteQuoteLine(id: number): Promise<void>;

  // Purchase Orders
  getPurchaseOrders(filters?: { status?: string; supplierId?: number; dateFrom?: string; dateTo?: string }): Promise<PurchaseOrder[]>;
  getPurchaseOrder(id: number): Promise<PurchaseOrder | undefined>;
  createPurchaseOrder(po: InsertPurchaseOrder): Promise<PurchaseOrder>;
  updatePurchaseOrder(id: number, po: Partial<InsertPurchaseOrder>): Promise<PurchaseOrder>;
  approvePurchaseOrder(id: number, approvedBy: string): Promise<PurchaseOrder>;
  getPurchaseOrderLines(poId: number): Promise<PurchaseOrderLine[]>;
  createPurchaseOrderLine(poLine: InsertPurchaseOrderLine): Promise<PurchaseOrderLine>;
  updatePurchaseOrderLine(id: number, poLine: Partial<InsertPurchaseOrderLine>): Promise<PurchaseOrderLine>;
  deletePurchaseOrderLine(id: number): Promise<void>;

  // GRNs
  getGrns(filters?: { status?: string; warehouseId?: number; dateFrom?: string; dateTo?: string }): Promise<Grn[]>;
  getGrn(id: number): Promise<Grn | undefined>;
  createGrn(grn: InsertGrn): Promise<Grn>;
  updateGrn(id: number, grn: Partial<InsertGrn>): Promise<Grn>;
  getGrnLines(grnId: number): Promise<GrnLine[]>;
  createGrnLine(grnLine: InsertGrnLine): Promise<GrnLine>;
  updateGrnLine(id: number, grnLine: Partial<InsertGrnLine>): Promise<GrnLine>;
  deleteGrnLine(id: number): Promise<void>;

  // Work Orders
  getWorkOrders(filters?: { status?: string; itemId?: number; dateFrom?: string; dateTo?: string }): Promise<WorkOrder[]>;
  getWorkOrder(id: number): Promise<WorkOrder | undefined>;
  createWorkOrder(wo: InsertWorkOrder): Promise<WorkOrder>;
  updateWorkOrder(id: number, wo: Partial<InsertWorkOrder>): Promise<WorkOrder>;
  releaseWorkOrder(id: number, releasedBy: string): Promise<WorkOrder>;

  // MINs
  getMins(filters?: { status?: string; warehouseId?: number; workOrderId?: number; dateFrom?: string; dateTo?: string }): Promise<Min[]>;
  getMin(id: number): Promise<Min | undefined>;
  createMin(min: InsertMin): Promise<Min>;
  updateMin(id: number, min: Partial<InsertMin>): Promise<Min>;
  getMinLines(minId: number): Promise<MinLine[]>;
  createMinLine(minLine: InsertMinLine): Promise<MinLine>;
  updateMinLine(id: number, minLine: Partial<InsertMinLine>): Promise<MinLine>;
  deleteMinLine(id: number): Promise<void>;

  // MRNs
  getMrns(filters?: { status?: string; warehouseId?: number; dateFrom?: string; dateTo?: string }): Promise<Mrn[]>;
  getMrn(id: number): Promise<Mrn | undefined>;
  createMrn(mrn: InsertMrn): Promise<Mrn>;
  updateMrn(id: number, mrn: Partial<InsertMrn>): Promise<Mrn>;
  getMrnLines(mrnId: number): Promise<MrnLine[]>;
  createMrnLine(mrnLine: InsertMrnLine): Promise<MrnLine>;
  updateMrnLine(id: number, mrnLine: Partial<InsertMrnLine>): Promise<MrnLine>;
  deleteMrnLine(id: number): Promise<void>;

  // Transfers
  getTransfers(filters?: { status?: string; fromWarehouseId?: number; toWarehouseId?: number; dateFrom?: string; dateTo?: string }): Promise<any[]>;
  getTransfer(id: number): Promise<any>;
  createTransfer(transfer: any): Promise<any>;
  getTransferLines(transferId: number): Promise<any[]>;
  createTransferLine(transferLine: any): Promise<any>;
  processTransferWithStockUpdate(transfer: any, lines: any[]): Promise<any>;

  // Adjustments
  getAdjustments(filters?: { status?: string; warehouseId?: number; dateFrom?: string; dateTo?: string }): Promise<any[]>;
  getAdjustment(id: number): Promise<any>;
  createAdjustment(adjustment: any): Promise<any>;
  getAdjustmentLines(adjustmentId: number): Promise<any[]>;
  createAdjustmentLine(adjustmentLine: any): Promise<any>;
  processAdjustmentWithStockUpdate(adjustment: any, lines: any[]): Promise<any>;

  // DTR and Stock Management
  getDtrEntries(filters?: { itemId?: number; warehouseId?: number; transactionType?: string; dateFrom?: string; dateTo?: string; workOrderId?: number }): Promise<Dtr[]>;
  createDtrEntry(dtrEntry: InsertDtr): Promise<Dtr>;
  getStockLevels(filters?: { itemId?: number; warehouseId?: number; binId?: number }): Promise<StockLevel[]>;
  updateStockLevel(stockLevel: InsertStockLevel): Promise<StockLevel>;

  // Settings
  getSettings(): Promise<Setting[]>;
  getSetting(key: string): Promise<Setting | undefined>;
  updateSetting(key: string, value: string, updatedBy: string): Promise<Setting>;

  // Utility functions
  generateSequentialNumber(prefix: string): Promise<string>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(asc(users.firstName), asc(users.lastName));
  }

  async createUser(userData: Omit<UpsertUser, 'id'>): Promise<User> {
    // Hash password if provided and non-empty
    if (userData.password && userData.password.trim().length > 0) {
      userData.password = await bcrypt.hash(userData.password, 10);
    } else if ('password' in userData) {
      // Remove empty/whitespace passwords from insert
      delete userData.password;
    }
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async updateUser(id: string, userData: Partial<UpsertUser>): Promise<User | null> {
    // Hash password if provided and non-empty
    if (userData.password && userData.password.trim().length > 0) {
      userData.password = await bcrypt.hash(userData.password, 10);
    } else if ('password' in userData) {
      // Remove empty/whitespace passwords from update
      delete userData.password;
    }
    
    const [user] = await db
      .update(users)
      .set({
        ...userData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user || null;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return (result.rowCount || 0) > 0;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.email,
        set: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          role: userData.role,
          warehouseScope: userData.warehouseScope,
          departmentScope: userData.departmentScope,
          supplierScope: userData.supplierScope,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Password-based authentication methods
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async validateUserPassword(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (!user || !user.password) {
      return null;
    }
    
    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }

  async setUserPassword(userId: string, password: string): Promise<boolean> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db
      .update(users)
      .set({ 
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
    return (result.rowCount || 0) > 0;
  }

  // Warehouses
  async getWarehouses(): Promise<Warehouse[]> {
    return await db.select().from(warehouses).where(eq(warehouses.isActive, true)).orderBy(asc(warehouses.name));
  }

  async getWarehouse(id: number): Promise<Warehouse | undefined> {
    const [warehouse] = await db.select().from(warehouses).where(eq(warehouses.id, id));
    return warehouse;
  }

  async createWarehouse(warehouse: InsertWarehouse): Promise<Warehouse> {
    const [newWarehouse] = await db.insert(warehouses).values(warehouse).returning();
    return newWarehouse;
  }

  async updateWarehouse(id: number, warehouse: Partial<InsertWarehouse>): Promise<Warehouse> {
    const [updatedWarehouse] = await db
      .update(warehouses)
      .set({ ...warehouse, updatedAt: new Date() })
      .where(eq(warehouses.id, id))
      .returning();
    return updatedWarehouse;
  }

  async deleteWarehouse(id: number): Promise<void> {
    await db.update(warehouses).set({ isActive: false }).where(eq(warehouses.id, id));
  }

  // Bins
  async getBinsByWarehouse(warehouseId: number): Promise<Bin[]> {
    return await db
      .select()
      .from(bins)
      .where(and(eq(bins.warehouseId, warehouseId), eq(bins.isActive, true)))
      .orderBy(asc(bins.code));
  }

  async getBin(id: number): Promise<Bin | undefined> {
    const [bin] = await db.select().from(bins).where(eq(bins.id, id));
    return bin;
  }

  async createBin(bin: InsertBin): Promise<Bin> {
    const [newBin] = await db.insert(bins).values(bin).returning();
    return newBin;
  }

  async updateBin(id: number, bin: Partial<InsertBin>): Promise<Bin> {
    const [updatedBin] = await db
      .update(bins)
      .set({ ...bin, updatedAt: new Date() })
      .where(eq(bins.id, id))
      .returning();
    return updatedBin;
  }

  async deleteBin(id: number): Promise<void> {
    await db.update(bins).set({ isActive: false }).where(eq(bins.id, id));
  }

  // Suppliers
  async getSuppliers(): Promise<Supplier[]> {
    return await db.select().from(suppliers).where(eq(suppliers.isActive, true)).orderBy(asc(suppliers.name));
  }

  async getSupplier(id: number): Promise<Supplier | undefined> {
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return supplier;
  }

  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const [newSupplier] = await db.insert(suppliers).values(supplier).returning();
    return newSupplier;
  }

  async updateSupplier(id: number, supplier: Partial<InsertSupplier>): Promise<Supplier> {
    const [updatedSupplier] = await db
      .update(suppliers)
      .set({ ...supplier, updatedAt: new Date() })
      .where(eq(suppliers.id, id))
      .returning();
    return updatedSupplier;
  }

  async deleteSupplier(id: number): Promise<void> {
    await db.update(suppliers).set({ isActive: false }).where(eq(suppliers.id, id));
  }

  // Items
  async getItems(filters?: { search?: string; category?: string; supplierId?: number }): Promise<Item[]> {
    const conditions = [eq(items.isActive, true)];
    
    if (filters?.search) {
      conditions.push(
        sql`${items.code} ILIKE ${`%${filters.search}%`} OR ${items.name} ILIKE ${`%${filters.search}%`} OR ${items.nameAr} ILIKE ${`%${filters.search}%`}`
      );
    }
    
    if (filters?.category) {
      conditions.push(eq(items.category, filters.category));
    }
    
    if (filters?.supplierId) {
      conditions.push(eq(items.defaultSupplierId, filters.supplierId));
    }
    
    return await db.select().from(items).where(and(...conditions)).orderBy(asc(items.name));
  }

  async getItem(id: number): Promise<Item | undefined> {
    const [item] = await db.select().from(items).where(eq(items.id, id));
    return item;
  }

  async getItemByCode(code: string): Promise<Item | undefined> {
    const [item] = await db.select().from(items).where(eq(items.code, code));
    return item;
  }

  async createItem(item: InsertItem): Promise<Item> {
    try {
      console.log("Creating item in database:", item.code);
      const [newItem] = await db.insert(items).values(item).returning();
      console.log("Successfully created item:", newItem.id);
      return newItem;
    } catch (error) {
      console.error("Database error creating item:", error);
      throw new Error(`Failed to create item: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateItem(id: number, item: Partial<InsertItem>): Promise<Item> {
    const [updatedItem] = await db
      .update(items)
      .set({ ...item, updatedAt: new Date() })
      .where(eq(items.id, id))
      .returning();
    return updatedItem;
  }

  async deleteItem(id: number): Promise<void> {
    await db.update(items).set({ isActive: false }).where(eq(items.id, id));
  }

  // BOMs
  async getBomsByParentItem(parentItemId: number): Promise<Bom[]> {
    return await db
      .select()
      .from(boms)
      .where(eq(boms.parentItemId, parentItemId))
      .orderBy(desc(boms.version));
  }

  async getActiveBom(parentItemId: number): Promise<Bom | undefined> {
    const [bom] = await db
      .select()
      .from(boms)
      .where(and(eq(boms.parentItemId, parentItemId), eq(boms.isActive, true)));
    return bom;
  }

  async getBom(id: number): Promise<Bom | undefined> {
    const [bom] = await db.select().from(boms).where(eq(boms.id, id));
    return bom;
  }

  async createBom(bom: InsertBom): Promise<Bom> {
    const [newBom] = await db.insert(boms).values(bom).returning();
    return newBom;
  }

  async updateBom(id: number, bom: Partial<InsertBom>): Promise<Bom> {
    const [updatedBom] = await db
      .update(boms)
      .set({ ...bom, updatedAt: new Date() })
      .where(eq(boms.id, id))
      .returning();
    return updatedBom;
  }

  async activateBom(id: number, parentItemId: number): Promise<Bom> {
    // Deactivate all other BOMs for this parent item
    await db
      .update(boms)
      .set({ isActive: false })
      .where(eq(boms.parentItemId, parentItemId));
    
    // Activate the selected BOM
    const [activatedBom] = await db
      .update(boms)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(boms.id, id))
      .returning();
    
    return activatedBom;
  }

  async getBomLines(bomId: number): Promise<BomLine[]> {
    return await db
      .select()
      .from(bomLines)
      .where(eq(bomLines.bomId, bomId))
      .orderBy(asc(bomLines.sortOrder));
  }

  async createBomLine(bomLine: InsertBomLine): Promise<BomLine> {
    const [newBomLine] = await db.insert(bomLines).values(bomLine).returning();
    return newBomLine;
  }

  async updateBomLine(id: number, bomLine: Partial<InsertBomLine>): Promise<BomLine> {
    const [updatedBomLine] = await db
      .update(bomLines)
      .set({ ...bomLine, updatedAt: new Date() })
      .where(eq(bomLines.id, id))
      .returning();
    return updatedBomLine;
  }

  async deleteBomLine(id: number): Promise<void> {
    await db.delete(bomLines).where(eq(bomLines.id, id));
  }

  // Parts Lists
  async getPartsLists(filters?: { category?: string; isActive?: boolean }): Promise<PartsList[]> {
    const conditions = [];
    
    if (filters?.category) {
      conditions.push(eq(partsLists.category, filters.category));
    }
    
    if (filters?.isActive !== undefined) {
      conditions.push(eq(partsLists.isActive, filters.isActive));
    }
    
    const query = conditions.length > 0 
      ? db.select().from(partsLists).where(and(...conditions))
      : db.select().from(partsLists);
    
    return await query.orderBy(desc(partsLists.createdAt));
  }

  async getPartsList(id: number): Promise<PartsList | undefined> {
    const [partsList] = await db.select().from(partsLists).where(eq(partsLists.id, id));
    return partsList;
  }

  async createPartsList(partsList: InsertPartsList): Promise<PartsList> {
    const [newPartsList] = await db.insert(partsLists).values(partsList).returning();
    return newPartsList;
  }

  async updatePartsList(id: number, partsList: Partial<InsertPartsList>): Promise<PartsList> {
    const [updatedPartsList] = await db
      .update(partsLists)
      .set({ ...partsList, updatedAt: new Date() })
      .where(eq(partsLists.id, id))
      .returning();
    return updatedPartsList;
  }

  async deletePartsList(id: number): Promise<void> {
    // Delete all parts list lines first
    await db.delete(partsListLines).where(eq(partsListLines.partsListId, id));
    // Then delete the parts list
    await db.delete(partsLists).where(eq(partsLists.id, id));
  }

  // Parts List Lines
  async getPartsListLines(partsListId: number): Promise<PartsListLine[]> {
    return await db
      .select()
      .from(partsListLines)
      .where(eq(partsListLines.partsListId, partsListId))
      .orderBy(asc(partsListLines.sortOrder));
  }

  async createPartsListLine(partsListLine: InsertPartsListLine): Promise<PartsListLine> {
    const [newPartsListLine] = await db.insert(partsListLines).values(partsListLine).returning();
    return newPartsListLine;
  }

  async updatePartsListLine(id: number, partsListLine: Partial<InsertPartsListLine>): Promise<PartsListLine> {
    const [updatedPartsListLine] = await db
      .update(partsListLines)
      .set({ ...partsListLine, updatedAt: new Date() })
      .where(eq(partsListLines.id, id))
      .returning();
    return updatedPartsListLine;
  }

  async deletePartsListLine(id: number): Promise<void> {
    await db.delete(partsListLines).where(eq(partsListLines.id, id));
  }

  // RFQs
  async getRfqs(filters?: { status?: string; dateFrom?: string; dateTo?: string }): Promise<Rfq[]> {
    const conditions = [];
    
    if (filters?.status) {
      conditions.push(eq(rfqs.status, filters.status as any));
    }
    
    if (filters?.dateFrom) {
      conditions.push(gte(rfqs.requestDate, filters.dateFrom));
    }
    
    if (filters?.dateTo) {
      conditions.push(lte(rfqs.requestDate, filters.dateTo));
    }
    
    const query = conditions.length > 0 
      ? db.select().from(rfqs).where(and(...conditions))
      : db.select().from(rfqs);
    
    return await query.orderBy(desc(rfqs.requestDate));
  }

  async getRfq(id: number): Promise<Rfq | undefined> {
    const [rfq] = await db.select().from(rfqs).where(eq(rfqs.id, id));
    return rfq;
  }

  async createRfq(rfq: InsertRfq): Promise<Rfq> {
    const [newRfq] = await db.insert(rfqs).values(rfq).returning();
    return newRfq;
  }

  async updateRfq(id: number, rfq: Partial<InsertRfq>): Promise<Rfq> {
    const [updatedRfq] = await db
      .update(rfqs)
      .set({ ...rfq, updatedAt: new Date() })
      .where(eq(rfqs.id, id))
      .returning();
    return updatedRfq;
  }

  async getRfqLines(rfqId: number): Promise<RfqLine[]> {
    return await db.select().from(rfqLines).where(eq(rfqLines.rfqId, rfqId));
  }

  async createRfqLine(rfqLine: InsertRfqLine): Promise<RfqLine> {
    const [newRfqLine] = await db.insert(rfqLines).values(rfqLine).returning();
    return newRfqLine;
  }

  async updateRfqLine(id: number, rfqLine: Partial<InsertRfqLine>): Promise<RfqLine> {
    const [updatedRfqLine] = await db
      .update(rfqLines)
      .set({ ...rfqLine, updatedAt: new Date() })
      .where(eq(rfqLines.id, id))
      .returning();
    return updatedRfqLine;
  }

  async deleteRfqLine(id: number): Promise<void> {
    await db.delete(rfqLines).where(eq(rfqLines.id, id));
  }

  // Quotes
  async getQuotes(filters?: { status?: string; supplierId?: number; rfqId?: number; dateFrom?: string; dateTo?: string }): Promise<Quote[]> {
    const conditions = [];
    
    if (filters?.status) {
      conditions.push(eq(quotes.status, filters.status as any));
    }
    
    if (filters?.supplierId) {
      conditions.push(eq(quotes.supplierId, filters.supplierId));
    }
    
    if (filters?.rfqId) {
      conditions.push(eq(quotes.rfqId, filters.rfqId));
    }
    
    if (filters?.dateFrom) {
      conditions.push(gte(quotes.quoteDate, filters.dateFrom));
    }
    
    if (filters?.dateTo) {
      conditions.push(lte(quotes.quoteDate, filters.dateTo));
    }
    
    const query = conditions.length > 0 
      ? db.select().from(quotes).where(and(...conditions))
      : db.select().from(quotes);
    
    return await query.orderBy(desc(quotes.quoteDate));
  }

  async getQuotesByRfq(rfqId: number): Promise<Quote[]> {
    return await db.select().from(quotes).where(eq(quotes.rfqId, rfqId)).orderBy(desc(quotes.quoteDate));
  }

  async getQuote(id: number): Promise<Quote | undefined> {
    const [quote] = await db.select().from(quotes).where(eq(quotes.id, id));
    return quote;
  }

  async createQuote(quote: InsertQuote): Promise<Quote> {
    const [newQuote] = await db.insert(quotes).values(quote).returning();
    return newQuote;
  }

  async updateQuote(id: number, quote: Partial<InsertQuote>): Promise<Quote> {
    const [updatedQuote] = await db
      .update(quotes)
      .set({ ...quote, updatedAt: new Date() })
      .where(eq(quotes.id, id))
      .returning();
    return updatedQuote;
  }

  async getQuoteLines(quoteId: number): Promise<QuoteLine[]> {
    return await db.select().from(quoteLines).where(eq(quoteLines.quoteId, quoteId));
  }

  async createQuoteLine(quoteLine: InsertQuoteLine): Promise<QuoteLine> {
    const [newQuoteLine] = await db.insert(quoteLines).values(quoteLine).returning();
    return newQuoteLine;
  }

  async updateQuoteLine(id: number, quoteLine: Partial<InsertQuoteLine>): Promise<QuoteLine> {
    const [updatedQuoteLine] = await db
      .update(quoteLines)
      .set({ ...quoteLine, updatedAt: new Date() })
      .where(eq(quoteLines.id, id))
      .returning();
    return updatedQuoteLine;
  }

  async deleteQuoteLine(id: number): Promise<void> {
    await db.delete(quoteLines).where(eq(quoteLines.id, id));
  }

  // Purchase Orders
  async getPurchaseOrders(filters?: { status?: string; supplierId?: number; dateFrom?: string; dateTo?: string }): Promise<PurchaseOrder[]> {
    const conditions = [];
    
    if (filters?.status) {
      conditions.push(eq(purchaseOrders.status, filters.status as any));
    }
    
    if (filters?.supplierId) {
      conditions.push(eq(purchaseOrders.supplierId, filters.supplierId));
    }
    
    if (filters?.dateFrom) {
      conditions.push(gte(purchaseOrders.orderDate, filters.dateFrom));
    }
    
    if (filters?.dateTo) {
      conditions.push(lte(purchaseOrders.orderDate, filters.dateTo));
    }
    
    const query = conditions.length > 0 
      ? db.select().from(purchaseOrders).where(and(...conditions))
      : db.select().from(purchaseOrders);
    
    return await query.orderBy(desc(purchaseOrders.orderDate));
  }

  async getPurchaseOrder(id: number): Promise<PurchaseOrder | undefined> {
    const [po] = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id));
    return po;
  }

  async createPurchaseOrder(po: InsertPurchaseOrder): Promise<PurchaseOrder> {
    const [newPo] = await db.insert(purchaseOrders).values(po).returning();
    return newPo;
  }

  async updatePurchaseOrder(id: number, po: Partial<InsertPurchaseOrder>): Promise<PurchaseOrder> {
    const [updatedPo] = await db
      .update(purchaseOrders)
      .set({ ...po, updatedAt: new Date() })
      .where(eq(purchaseOrders.id, id))
      .returning();
    return updatedPo;
  }

  async approvePurchaseOrder(id: number, approvedBy: string): Promise<PurchaseOrder> {
    const [approvedPo] = await db
      .update(purchaseOrders)
      .set({ 
        status: 'approved', 
        approvedBy, 
        approvedAt: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(purchaseOrders.id, id))
      .returning();
    return approvedPo;
  }

  async getPurchaseOrderLines(poId: number): Promise<PurchaseOrderLine[]> {
    return await db.select().from(purchaseOrderLines).where(eq(purchaseOrderLines.poId, poId));
  }

  async createPurchaseOrderLine(poLine: InsertPurchaseOrderLine): Promise<PurchaseOrderLine> {
    const [newPoLine] = await db.insert(purchaseOrderLines).values(poLine).returning();
    return newPoLine;
  }

  async updatePurchaseOrderLine(id: number, poLine: Partial<InsertPurchaseOrderLine>): Promise<PurchaseOrderLine> {
    const [updatedPoLine] = await db
      .update(purchaseOrderLines)
      .set({ ...poLine, updatedAt: new Date() })
      .where(eq(purchaseOrderLines.id, id))
      .returning();
    return updatedPoLine;
  }

  async deletePurchaseOrderLine(id: number): Promise<void> {
    await db.delete(purchaseOrderLines).where(eq(purchaseOrderLines.id, id));
  }

  // GRNs
  async getGrns(filters?: { status?: string; warehouseId?: number; dateFrom?: string; dateTo?: string }): Promise<Grn[]> {
    const conditions = [];
    
    if (filters?.status) {
      conditions.push(eq(grns.status, filters.status as any));
    }
    
    if (filters?.warehouseId) {
      conditions.push(eq(grns.warehouseId, filters.warehouseId));
    }
    
    if (filters?.dateFrom) {
      conditions.push(gte(grns.receiptDate, filters.dateFrom));
    }
    
    if (filters?.dateTo) {
      conditions.push(lte(grns.receiptDate, filters.dateTo));
    }
    
    const query = conditions.length > 0 
      ? db.select().from(grns).where(and(...conditions))
      : db.select().from(grns);
    
    return await query.orderBy(desc(grns.receiptDate));
  }

  async getGrn(id: number): Promise<Grn | undefined> {
    const [grn] = await db.select().from(grns).where(eq(grns.id, id));
    return grn;
  }

  async createGrn(grn: InsertGrn): Promise<Grn> {
    const [newGrn] = await db.insert(grns).values(grn).returning();
    return newGrn;
  }

  // Process GRN and update stock levels
  async processGrnWithStockUpdate(grn: InsertGrn, lines: any[]): Promise<Grn> {
    console.log("Processing GRN with stock updates:", grn.number);
    
    // Create the GRN header
    const createdGrn = await this.createGrn(grn);
    
    // Process each line to update stock and create DTR entries
    for (const line of lines) {
      // Create GRN line
      const grnLineData = {
        ...line,
        grnId: createdGrn.id,
      };
      await this.createGrnLine(grnLineData);
      
      // Update stock level (increase stock for receipt)
      const currentStock = await this.getStockLevels({ 
        itemId: line.itemId, 
        warehouseId: grn.warehouseId 
      });
      
      let newQuantity = parseFloat(line.quantity || '0');
      let newAvailable = parseFloat(line.quantity || '0');
      
      if (currentStock.length > 0) {
        const existing = currentStock[0];
        newQuantity += parseFloat(existing.quantity || '0');
        newAvailable += parseFloat(existing.availableQuantity || '0');
      }
      
      await this.updateStockLevel({
        itemId: line.itemId,
        warehouseId: grn.warehouseId,
        binId: line.binId || null,
        quantity: newQuantity.toString(),
        availableQuantity: newAvailable.toString(),
        averageCost: line.unitCost || null,
        lastTransactionDate: new Date(),
      });
      
      // Create DTR entry for receipt
      await this.createDtrEntry({
        transactionType: 'GRN',
        voucherNumber: grn.number || '',
        itemId: line.itemId,
        warehouseId: grn.warehouseId,
        binId: line.binId || null,
        quantityIn: line.quantity || '0',
        quantityOut: '0',
        uom: line.uom || 'PCS',
        unitCost: line.unitCost || null,
        totalCost: ((parseFloat(line.quantity || '0')) * (parseFloat(line.unitCost || '0'))).toString(),
        runningBalance: newQuantity.toString(),
        createdBy: grn.receivedBy || '',
        reference: `GRN ${grn.number} - Item Receipt`,
      });
    }
    
    console.log("GRN processed successfully with stock updates");
    return createdGrn;
  }

  async updateGrn(id: number, grn: Partial<InsertGrn>): Promise<Grn> {
    const [updatedGrn] = await db
      .update(grns)
      .set({ ...grn, updatedAt: new Date() })
      .where(eq(grns.id, id))
      .returning();
    return updatedGrn;
  }

  async getGrnLines(grnId: number): Promise<GrnLine[]> {
    return await db.select().from(grnLines).where(eq(grnLines.grnId, grnId));
  }

  async createGrnLine(grnLine: InsertGrnLine): Promise<GrnLine> {
    const [newGrnLine] = await db.insert(grnLines).values(grnLine).returning();
    return newGrnLine;
  }

  async updateGrnLine(id: number, grnLine: Partial<InsertGrnLine>): Promise<GrnLine> {
    const [updatedGrnLine] = await db
      .update(grnLines)
      .set({ ...grnLine, updatedAt: new Date() })
      .where(eq(grnLines.id, id))
      .returning();
    return updatedGrnLine;
  }

  async deleteGrnLine(id: number): Promise<void> {
    await db.delete(grnLines).where(eq(grnLines.id, id));
  }

  // Work Orders
  async getWorkOrders(filters?: { status?: string; itemId?: number; dateFrom?: string; dateTo?: string }): Promise<WorkOrder[]> {
    const conditions = [];
    
    if (filters?.status) {
      conditions.push(eq(workOrders.status, filters.status as any));
    }
    
    if (filters?.itemId) {
      conditions.push(eq(workOrders.itemId, filters.itemId));
    }
    
    if (filters?.dateFrom) {
      conditions.push(gte(workOrders.startDate, filters.dateFrom));
    }
    
    if (filters?.dateTo) {
      conditions.push(lte(workOrders.dueDate, filters.dateTo));
    }
    
    const query = conditions.length > 0 
      ? db.select().from(workOrders).where(and(...conditions))
      : db.select().from(workOrders);
    
    return await query.orderBy(desc(workOrders.createdAt));
  }

  async getWorkOrder(id: number): Promise<WorkOrder | undefined> {
    const [wo] = await db.select().from(workOrders).where(eq(workOrders.id, id));
    return wo;
  }

  async createWorkOrder(wo: InsertWorkOrder): Promise<WorkOrder> {
    const [newWo] = await db.insert(workOrders).values(wo).returning();
    return newWo;
  }

  async updateWorkOrder(id: number, wo: Partial<InsertWorkOrder>): Promise<WorkOrder> {
    const [updatedWo] = await db
      .update(workOrders)
      .set({ ...wo, updatedAt: new Date() })
      .where(eq(workOrders.id, id))
      .returning();
    return updatedWo;
  }

  async releaseWorkOrder(id: number, releasedBy: string): Promise<WorkOrder> {
    const [releasedWo] = await db
      .update(workOrders)
      .set({ 
        status: 'released', 
        releasedBy, 
        releasedAt: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(workOrders.id, id))
      .returning();
    return releasedWo;
  }

  // MINs
  async getMins(filters?: { status?: string; warehouseId?: number; workOrderId?: number; dateFrom?: string; dateTo?: string }): Promise<Min[]> {
    const conditions = [];
    
    if (filters?.status) {
      conditions.push(eq(mins.status, filters.status as any));
    }
    
    if (filters?.warehouseId) {
      conditions.push(eq(mins.warehouseId, filters.warehouseId));
    }
    
    if (filters?.workOrderId) {
      conditions.push(eq(mins.workOrderId, filters.workOrderId));
    }
    
    if (filters?.dateFrom) {
      conditions.push(gte(mins.issueDate, filters.dateFrom));
    }
    
    if (filters?.dateTo) {
      conditions.push(lte(mins.issueDate, filters.dateTo));
    }
    
    const query = conditions.length > 0 
      ? db.select().from(mins).where(and(...conditions))
      : db.select().from(mins);
    
    return await query.orderBy(desc(mins.issueDate));
  }

  async getMin(id: number): Promise<Min | undefined> {
    const [min] = await db.select().from(mins).where(eq(mins.id, id));
    return min;
  }

  async createMin(min: InsertMin): Promise<Min> {
    const [newMin] = await db.insert(mins).values(min).returning();
    return newMin;
  }

  // Process MIN and update stock levels  
  async processMinWithStockUpdate(min: InsertMin, lines: any[]): Promise<Min> {
    console.log("Processing MIN with stock updates:", min.number);
    
    // Create the MIN header
    const createdMin = await this.createMin(min);
    
    // Process each line to update stock and create DTR entries
    for (const line of lines) {
      // Create MIN line
      const minLineData = {
        ...line,
        minId: createdMin.id,
      };
      await this.createMinLine(minLineData);
      
      // Update stock level (decrease stock for issue)
      const currentStock = await this.getStockLevels({ 
        itemId: line.itemId, 
        warehouseId: min.warehouseId 
      });
      
      let newQuantity = 0;
      let newAvailable = 0;
      
      if (currentStock.length > 0) {
        const existing = currentStock[0];
        newQuantity = parseFloat(existing.quantity || '0') - parseFloat(line.quantity || '0');
        newAvailable = parseFloat(existing.availableQuantity || '0') - parseFloat(line.quantity || '0');
        
        // Ensure quantities don't go negative
        newQuantity = Math.max(0, newQuantity);
        newAvailable = Math.max(0, newAvailable);
      }
      
      await this.updateStockLevel({
        itemId: line.itemId,
        warehouseId: min.warehouseId,
        binId: line.binId || null,
        quantity: newQuantity.toString(),
        availableQuantity: newAvailable.toString(),
        lastTransactionDate: new Date(),
      });
      
      // Create DTR entry for issue
      await this.createDtrEntry({
        transactionType: 'ISSUE',
        voucherNumber: min.number || '',
        itemId: line.itemId,
        warehouseId: min.warehouseId,
        binId: line.binId || null,
        quantityIn: '0',
        quantityOut: line.quantity || '0',
        uom: line.uom || 'PCS',
        runningBalance: newQuantity.toString(),
        workOrderId: min.workOrderId || null,
        createdBy: min.requestedBy || '',
        reference: `MIN ${min.number} - Material Issue`,
      });
    }
    
    console.log("MIN processed successfully with stock updates");
    return createdMin;
  }

  async updateMin(id: number, min: Partial<InsertMin>): Promise<Min> {
    const [updatedMin] = await db
      .update(mins)
      .set({ ...min, updatedAt: new Date() })
      .where(eq(mins.id, id))
      .returning();
    return updatedMin;
  }

  async getMinLines(minId: number): Promise<MinLine[]> {
    return await db.select().from(minLines).where(eq(minLines.minId, minId));
  }

  async createMinLine(minLine: InsertMinLine): Promise<MinLine> {
    const [newMinLine] = await db.insert(minLines).values(minLine).returning();
    return newMinLine;
  }

  async updateMinLine(id: number, minLine: Partial<InsertMinLine>): Promise<MinLine> {
    const [updatedMinLine] = await db
      .update(minLines)
      .set({ ...minLine, updatedAt: new Date() })
      .where(eq(minLines.id, id))
      .returning();
    return updatedMinLine;
  }

  async deleteMinLine(id: number): Promise<void> {
    await db.delete(minLines).where(eq(minLines.id, id));
  }

  // MRNs
  async getMrns(filters?: { status?: string; warehouseId?: number; dateFrom?: string; dateTo?: string }): Promise<Mrn[]> {
    const conditions = [];
    
    if (filters?.status) {
      conditions.push(eq(mrns.status, filters.status as any));
    }
    
    if (filters?.warehouseId) {
      conditions.push(eq(mrns.warehouseId, filters.warehouseId));
    }
    
    if (filters?.dateFrom) {
      conditions.push(gte(mrns.returnDate, filters.dateFrom));
    }
    
    if (filters?.dateTo) {
      conditions.push(lte(mrns.returnDate, filters.dateTo));
    }
    
    const query = conditions.length > 0 
      ? db.select().from(mrns).where(and(...conditions))
      : db.select().from(mrns);
    
    return await query.orderBy(desc(mrns.returnDate));
  }

  async getMrn(id: number): Promise<Mrn | undefined> {
    const [mrn] = await db.select().from(mrns).where(eq(mrns.id, id));
    return mrn;
  }

  async createMrn(mrn: InsertMrn): Promise<Mrn> {
    const [newMrn] = await db.insert(mrns).values(mrn).returning();
    return newMrn;
  }

  // Process MRN and update stock levels
  async processMrnWithStockUpdate(mrn: InsertMrn, lines: any[]): Promise<Mrn> {
    console.log("Processing MRN with stock updates:", mrn.number);
    
    // Create the MRN header
    const createdMrn = await this.createMrn(mrn);
    
    // Process each line to update stock and create DTR entries
    for (const line of lines) {
      // Create MRN line
      const mrnLineData = {
        ...line,
        mrnId: createdMrn.id,
      };
      await this.createMrnLine(mrnLineData);
      
      // Update stock level (increase stock for return)
      const currentStock = await this.getStockLevels({ 
        itemId: line.itemId, 
        warehouseId: mrn.warehouseId 
      });
      
      let newQuantity = parseFloat(line.quantity || '0');
      let newAvailable = parseFloat(line.quantity || '0');
      
      if (currentStock.length > 0) {
        const existing = currentStock[0];
        newQuantity += parseFloat(existing.quantity || '0');
        newAvailable += parseFloat(existing.availableQuantity || '0');
      }
      
      await this.updateStockLevel({
        itemId: line.itemId,
        warehouseId: mrn.warehouseId,
        binId: line.binId || null,
        quantity: newQuantity.toString(),
        availableQuantity: newAvailable.toString(),
        lastTransactionDate: new Date(),
      });
      
      // Create DTR entry for return
      await this.createDtrEntry({
        transactionType: 'RETURN',
        voucherNumber: mrn.number || '',
        itemId: line.itemId,
        warehouseId: mrn.warehouseId,
        binId: line.binId || null,
        quantityIn: line.quantity || '0',
        quantityOut: '0',
        uom: line.uom || 'PCS',
        runningBalance: newQuantity.toString(),
        createdBy: mrn.returnedBy || '',
        reference: `MRN ${mrn.number} - Material Return`,
      });
    }
    
    console.log("MRN processed successfully with stock updates");
    return createdMrn;
  }

  async updateMrn(id: number, mrn: Partial<InsertMrn>): Promise<Mrn> {
    const [updatedMrn] = await db
      .update(mrns)
      .set({ ...mrn, updatedAt: new Date() })
      .where(eq(mrns.id, id))
      .returning();
    return updatedMrn;
  }

  async getMrnLines(mrnId: number): Promise<MrnLine[]> {
    return await db.select().from(mrnLines).where(eq(mrnLines.mrnId, mrnId));
  }

  async createMrnLine(mrnLine: InsertMrnLine): Promise<MrnLine> {
    const [newMrnLine] = await db.insert(mrnLines).values(mrnLine).returning();
    return newMrnLine;
  }

  async updateMrnLine(id: number, mrnLine: Partial<InsertMrnLine>): Promise<MrnLine> {
    const [updatedMrnLine] = await db
      .update(mrnLines)
      .set({ ...mrnLine, updatedAt: new Date() })
      .where(eq(mrnLines.id, id))
      .returning();
    return updatedMrnLine;
  }

  async deleteMrnLine(id: number): Promise<void> {
    await db.delete(mrnLines).where(eq(mrnLines.id, id));
  }

  // DTR and Stock Management
  async getDtrEntries(filters?: { itemId?: number; warehouseId?: number; transactionType?: string; dateFrom?: string; dateTo?: string; workOrderId?: number }): Promise<Dtr[]> {
    const conditions = [];
    
    if (filters?.itemId) {
      conditions.push(eq(dtr.itemId, filters.itemId));
    }
    
    if (filters?.warehouseId) {
      conditions.push(eq(dtr.warehouseId, filters.warehouseId));
    }
    
    if (filters?.transactionType) {
      conditions.push(eq(dtr.transactionType, filters.transactionType as any));
    }
    
    if (filters?.workOrderId) {
      conditions.push(eq(dtr.workOrderId, filters.workOrderId));
    }
    
    if (filters?.dateFrom) {
      conditions.push(gte(dtr.transactionDate, new Date(filters.dateFrom)));
    }
    
    if (filters?.dateTo) {
      conditions.push(lte(dtr.transactionDate, new Date(filters.dateTo)));
    }
    
    const query = conditions.length > 0 
      ? db.select().from(dtr).where(and(...conditions))
      : db.select().from(dtr);
    
    return await query.orderBy(desc(dtr.transactionDate));
  }

  async createDtrEntry(dtrEntry: InsertDtr): Promise<Dtr> {
    const [newDtrEntry] = await db.insert(dtr).values(dtrEntry).returning();
    return newDtrEntry;
  }

  async getStockLevels(filters?: { itemId?: number; warehouseId?: number; binId?: number }): Promise<StockLevel[]> {
    const conditions = [];
    
    if (filters?.itemId) {
      conditions.push(eq(stockLevels.itemId, filters.itemId));
    }
    
    if (filters?.warehouseId) {
      conditions.push(eq(stockLevels.warehouseId, filters.warehouseId));
    }
    
    if (filters?.binId) {
      conditions.push(eq(stockLevels.binId, filters.binId));
    }
    
    const query = conditions.length > 0 
      ? db.select().from(stockLevels).where(and(...conditions))
      : db.select().from(stockLevels);
    
    return await query;
  }

  async updateStockLevel(stockLevel: InsertStockLevel): Promise<StockLevel> {
    const [updatedStockLevel] = await db
      .insert(stockLevels)
      .values(stockLevel)
      .onConflictDoUpdate({
        target: [stockLevels.itemId, stockLevels.warehouseId, stockLevels.binId],
        set: {
          quantity: stockLevel.quantity,
          reservedQuantity: stockLevel.reservedQuantity,
          availableQuantity: stockLevel.availableQuantity,
          averageCost: stockLevel.averageCost,
          lastTransactionDate: stockLevel.lastTransactionDate,
          updatedAt: new Date(),
        },
      })
      .returning();
    return updatedStockLevel;
  }

  // Settings
  async getSettings(): Promise<Setting[]> {
    return await db.select().from(settings).orderBy(asc(settings.category), asc(settings.key));
  }

  async getSetting(key: string): Promise<Setting | undefined> {
    const [setting] = await db.select().from(settings).where(eq(settings.key, key));
    return setting;
  }

  async updateSetting(key: string, value: string, updatedBy: string): Promise<Setting> {
    const [updatedSetting] = await db
      .insert(settings)
      .values({ key, value, updatedBy, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: settings.key,
        set: {
          value,
          updatedBy,
          updatedAt: new Date(),
        },
      })
      .returning();
    return updatedSetting;
  }

  // Utility functions
  async generateSequentialNumber(prefix: string): Promise<string> {
    const year = new Date().getFullYear();
    const yearPrefix = `${prefix}-${year}-`;
    
    let result: { number: string | null }[] = [];
    
    // Use proper Drizzle column references for each table type
    switch (prefix) {
      case 'PO':
        result = await db
          .select({ number: purchaseOrders.number })
          .from(purchaseOrders)
          .where(like(purchaseOrders.number, `${yearPrefix}%`))
          .orderBy(desc(purchaseOrders.number))
          .limit(1);
        break;
      case 'RFQ':
        result = await db
          .select({ number: rfqs.number })
          .from(rfqs)
          .where(like(rfqs.number, `${yearPrefix}%`))
          .orderBy(desc(rfqs.number))
          .limit(1);
        break;
      case 'QUOTE':
        result = await db
          .select({ number: quotes.quoteNumber })
          .from(quotes)
          .where(like(quotes.quoteNumber, `${yearPrefix}%`))
          .orderBy(desc(quotes.quoteNumber))
          .limit(1);
        break;
      case 'GRN':
        result = await db
          .select({ number: grns.number })
          .from(grns)
          .where(like(grns.number, `${yearPrefix}%`))
          .orderBy(desc(grns.number))
          .limit(1);
        break;
      case 'MIN':
        result = await db
          .select({ number: mins.number })
          .from(mins)
          .where(like(mins.number, `${yearPrefix}%`))
          .orderBy(desc(mins.number))
          .limit(1);
        break;
      case 'MRN':
        result = await db
          .select({ number: mrns.number })
          .from(mrns)
          .where(like(mrns.number, `${yearPrefix}%`))
          .orderBy(desc(mrns.number))
          .limit(1);
        break;
      default: // Work Orders
        result = await db
          .select({ number: workOrders.number })
          .from(workOrders)
          .where(like(workOrders.number, `${yearPrefix}%`))
          .orderBy(desc(workOrders.number))
          .limit(1);
        break;
    }
    
    let nextNumber = 1;
    if (result.length > 0 && result[0].number) {
      const lastNumber = result[0].number;
      const lastSequence = parseInt(lastNumber.split('-')[2]) || 0;
      nextNumber = lastSequence + 1;
    }
    
    return `${yearPrefix}${nextNumber.toString().padStart(4, '0')}`;
  }
}

export const storage = new DatabaseStorage();
