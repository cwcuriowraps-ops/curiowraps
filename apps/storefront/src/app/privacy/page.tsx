export const metadata = { title: "Privacy Policy | Curio Wrap" };

export default function PrivacyPage() {
  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto px-4 py-24 max-w-3xl sm:px-6 lg:px-8">
        <h1 className="text-4xl font-serif mb-12 text-text-primary text-center">Privacy Policy</h1>
        <div className="prose prose-lg prose-pink mx-auto">
          <p className="text-sm tracking-wider uppercase text-text-secondary mb-8">Last updated: July 2026</p>
          
          <h2 className="text-2xl font-serif text-text-primary mt-8 mb-4">Information We Collect</h2>
          <p className="text-text-secondary font-light leading-relaxed mb-6">We collect information you provide directly to us when you create an account, make a purchase, or communicate with us.</p>
          
          <h2 className="text-2xl font-serif text-text-primary mt-8 mb-4">How We Use Your Information</h2>
          <p className="text-text-secondary font-light leading-relaxed mb-6">We use the information we collect to provide, maintain, and improve our services, process transactions, and send you technical notices.</p>
          
          <h2 className="text-2xl font-serif text-text-primary mt-8 mb-4">Data Security</h2>
          <p className="text-text-secondary font-light leading-relaxed mb-6">We implement appropriate technical and organizational security measures designed to protect your personal information.</p>
        </div>
      </div>
    </div>
  );
}