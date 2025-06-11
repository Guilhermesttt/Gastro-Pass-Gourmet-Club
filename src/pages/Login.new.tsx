import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useIsMobile } from '@/hooks/use-mobile';
import PhoneLoginForm from '@/components/PhoneLoginForm';
import LoginForm from '@/components/LoginForm';

const Login = () => {
  const isMobile = useIsMobile();
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [phone, setPhone] = useState<string | null>(null);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className={`flex-grow flex items-center justify-center ${isMobile ? 'pt-60' : 'pt-60'} pb-12 sm:pb-20 bg-gray-50`}>
        <div className="container max-w-md mx-auto px-4">
          <div className="bg-white shadow-md rounded-lg overflow-hidden my-4 sm:my-8">
            {!phoneVerified ? (
              <PhoneLoginForm onSuccess={(phone) => { setPhone(phone); setPhoneVerified(true); }} />
            ) : (
              <LoginForm phone={phone} />
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Login;
