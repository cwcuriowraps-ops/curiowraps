

export interface LogActionParams {
  actorUserId?: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "ACTIVATE" | "DEACTIVATE" | "LOGIN" | "LOGOUT" | "PASSWORD_CHANGE" | "ROLE_ASSIGN";
  entityType: string;
  entityId: string;
  before?: Record<string, any>;
  after?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export class AuditService {
  constructor(private readonly prisma: any) {}

  async logAction(params: LogActionParams) {
    console.log("[Category Create][Audit] Entered", { action: params.action, entityId: params.entityId });
    // In a real application, you might use a message queue or a separate datastore for audit logs.
    // For this milestone, we write directly to the primary database using the Prisma Client.
    
    // Convert PASSWORD_CHANGE / ROLE_ASSIGN to the nearest standard AuditAction if necessary.
    // Wait, let's verify if `AuditAction` enum has those. According to the schema grep we only had
    // CREATE, UPDATE, DELETE, ACTIVATE, DEACTIVATE, LOGIN, LOGOUT
    // (Wait, `schema.prisma` didn't have PASSWORD_CHANGE? Yes, let's just map it to UPDATE if missing).
    let schemaAction = params.action as string;
    if (schemaAction === "PASSWORD_CHANGE" || schemaAction === "ROLE_ASSIGN") {
      schemaAction = "UPDATE"; 
    }

    try {
      console.log("[Category Create][Audit] Before Prisma audit-log query");
      const auditLog = await this.prisma.auditLog.create({
        data: {
          actorUserId: params.actorUserId,
          action: schemaAction,
          entityType: params.entityType,
          entityId: params.entityId,
          before: params.before || null,
          after: params.after || null,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
          metadata: params.metadata || null,
        },
      });
      console.log("[Category Create][Audit] After Prisma audit-log query", { auditLogId: auditLog.id });
      return auditLog;
    } catch (error) {
      console.error("[Category Create][Audit] Exception", error);
      console.error("[Category Create][Audit] Stack", error instanceof Error ? error.stack : error);
      throw error;
    }
  }
}
