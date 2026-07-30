"use client";

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Skeleton } from "@dashboard/ui";
import { format } from "date-fns";
import { ArrowLeft, Mail, Phone, Calendar, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { useAdminCustomer } from "@/api/customers";

export default function CustomerProfilePage() {
  const params = useParams();
  const id = params.id as string;
  
  const { data, isLoading } = useAdminCustomer(id);
  const customer = data?.data?.user;
  const orders = data?.data?.user?.orders || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-6">
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
          <div className="md:col-span-2 space-y-6">
            <Skeleton className="h-96 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <h2 className="text-xl font-semibold text-text-primary">Customer not found</h2>
        <p className="mt-2 text-text-secondary">The customer profile you're looking for doesn't exist.</p>
        <Link href="/customers" className="mt-6">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Customers
          </Button>
        </Link>
      </div>
    );
  }

  const totalSpent = orders.reduce((sum: number, order: any) => sum + Number(order.grandTotal || 0), 0);
  const roleName = typeof customer.role === "object" ? (customer.role?.name || "CUSTOMER") : (customer.role || "CUSTOMER");
  const customerName = `${customer.firstName || ""} ${customer.lastName || ""}`.trim() || customer.email || "Customer";

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-4">
        <Link href="/customers">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-3">
            {customerName}
            <Badge variant={roleName === "ADMIN" || roleName === "SUPER_ADMIN" ? "accent" : "default"}>
              {roleName}
            </Badge>
          </h1>
          <p className="text-sm text-text-secondary flex items-center gap-2 mt-1">
            <Calendar className="h-3.5 w-3.5" />
            Customer since {customer.createdAt ? format(new Date(customer.createdAt), "MMMM d, yyyy") : "N/A"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-6">
          {/* Customer Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-text-secondary">
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 mt-0.5" />
                <div>
                  <div className="font-medium text-text-primary">Email Address</div>
                  <a href={`mailto:${customer.email}`} className="hover:text-text-primary">{customer.email}</a>
                </div>
              </div>
              
              {customer.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="h-4 w-4 mt-0.5" />
                  <div>
                    <div className="font-medium text-text-primary">Phone Number</div>
                    <a href={`tel:${customer.phone}`} className="hover:text-text-primary">{customer.phone}</a>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-border">
                <span className="text-text-secondary text-sm">Total Orders</span>
                <span className="font-semibold text-text-primary">{orders.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary text-sm">Total Spent</span>
                <span className="font-semibold text-text-primary">₹{totalSpent.toLocaleString("en-IN")}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          {/* Order History */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShoppingBag className="h-5 w-5" />
                Order History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <div className="text-center py-8 text-text-secondary">
                  No orders placed yet.
                </div>
              ) : (
                <div className="space-y-4 divide-y divide-border">
                  {orders.map((order: any) => (
                    <div key={order.id} className="flex items-center justify-between pt-4 first:pt-0">
                      <div>
                        <Link href={`/orders/${order.id}`} className="font-medium text-text-primary hover:underline">
                          Order #{order.id.slice(0, 8).toUpperCase()}
                        </Link>
                        <div className="text-xs text-text-secondary mt-1">
                          {order.createdAt ? format(new Date(order.createdAt), "MMM d, yyyy") : "N/A"}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge 
                          variant={
                            order.status === "DELIVERED" ? "success" :
                            order.status === "CANCELLED" || order.status === "REFUNDED" ? "error" :
                            "default"
                          }
                        >
                          {order.status}
                        </Badge>
                        <div className="font-bold text-text-primary text-right min-w-[80px]">
                          ₹{Number(order.grandTotal || 0).toLocaleString("en-IN")}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
