export const metadata = { title: "Privacy Policy | Curio Wraps" };

export default function PrivacyPage() {
  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto px-4 py-8 sm:py-24 max-w-3xl sm:px-6 lg:px-8">
        <h1 className="text-2xl sm:text-4xl font-serif mb-6 sm:mb-12 text-text-primary text-center">Privacy Policy</h1>
        <div className="prose prose-lg prose-pink mx-auto">
          <p className="text-xs sm:text-sm tracking-wider uppercase text-text-secondary mb-6 sm:mb-8">Last updated: July 2026</p>
          
          <h2 className="text-xl sm:text-2xl font-serif text-text-primary mt-6 sm:mt-8 mb-3 sm:mb-4">Information We Collect</h2>
          <p className="text-text-secondary font-light leading-relaxed mb-4 sm:mb-6 text-sm sm:text-base">We collect information you provide directly to us when you create an account, make a purchase, or communicate with us.</p>
          
          <h2 className="text-xl sm:text-2xl font-serif text-text-primary mt-6 sm:mt-8 mb-3 sm:mb-4">How We Use Your Information</h2>
          <p className="text-text-secondary font-light leading-relaxed mb-4 sm:mb-6 text-sm sm:text-base">We use the information we collect to provide, maintain, and improve our services, process transactions, and send you technical notices.</p>
          
          <h2 className="text-xl sm:text-2xl font-serif text-text-primary mt-6 sm:mt-8 mb-3 sm:mb-4">Data Security</h2>
          <p className="text-text-secondary font-light leading-relaxed mb-4 sm:mb-6 text-sm sm:text-base">We implement appropriate technical and organizational security measures designed to protect your personal information.</p>
        </div>
      </div>
    </div>
  );
}