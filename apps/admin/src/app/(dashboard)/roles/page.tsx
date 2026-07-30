export default function RolesPage() {
  const roles = [
    { name: "SUPERADMIN", desc: "Full access to all system features and user management." },
    { name: "ADMIN", desc: "Access to store operations (Products, Orders, Inventory)." },
    { name: "MANAGER", desc: "Access to view orders and manage catalog, cannot edit settings." },
    { name: "CUSTOMER", desc: "Standard shopper access to storefront." }
  ];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8 text-text-primary">Roles & Permissions</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {roles.map(r => (
          <div key={r.name} className="p-6 bg-surface border border-border rounded-lg">
            <h3 className="text-xl font-bold text-primary mb-2">{r.name}</h3>
            <p className="text-text-secondary">{r.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}