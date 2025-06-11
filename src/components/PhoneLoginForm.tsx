import { useState } from 'react';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult, UserCredential } from 'firebase/auth';
import { auth } from '@/lib/firebase';

// Adicione a tipagem global para recaptchaVerifier
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare global {
  interface Window {
    recaptchaVerifier?: import('firebase/auth').RecaptchaVerifier;
  }
}

const PhoneLoginForm = ({ onSuccess }: { onSuccess: (phone: string, user: UserCredential) => void }) => {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
      }
      const confirmationResult = await signInWithPhoneNumber(auth, phone, window.recaptchaVerifier);
      setConfirmation(confirmationResult);
      setStep('code');
    } catch (err: any) {
      setError('Erro ao enviar SMS. Verifique o número e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (!confirmation) return;
      // Corrige: o código deve ser concatenado dos inputs separados
      const codeValue = code.split('').slice(0, 6).join('');
      const userCredential = await confirmation.confirm(codeValue);
      onSuccess(phone, userCredential);
    } catch (err: any) {
      setError('Código inválido. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {step === 'phone' && (
        <form onSubmit={handleSendCode} className="space-y-4">
          <label className="block text-sm font-medium">Celular</label>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="+55 99 99999-9999"
            className="w-full px-3 py-2 border rounded-lg"
            required
            disabled={loading}
          />
          <div id="recaptcha-container" />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button type="submit" className="w-full bg-primary text-white py-2 rounded-lg" disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar código SMS'}
          </button>
        </form>
      )}
      {step === 'code' && (
        <form onSubmit={handleVerifyCode} className="space-y-6">
          <div className="flex flex-col items-center mb-4">
            <div className="bg-yellow-400 rounded-full p-3 mb-2">
              <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><path d="M17 17H7V7h10v10zm2-12H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z" fill="#000"/></svg>
            </div>
            <p className="text-white text-center font-medium">Enviamos um código de segurança para o número <span className="text-yellow-400">{phone}</span><br/>Insira o código abaixo para confirmar sua identidade.</p>
          </div>
          <div className="flex justify-center gap-2 mb-2">
            {Array(6).fill(0).map((_, i) => (
              <input
                key={i}
                type="text"
                inputMode="numeric"
                maxLength={1}
                className="w-12 h-12 text-2xl text-center rounded-lg border-2 border-yellow-400 bg-gray-900 text-white focus:outline-none focus:border-yellow-500"
                value={code[i] || ''}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '');
                  let newCode = code.split('');
                  newCode[i] = val;
                  setCode(newCode.join('').slice(0, 6));
                  // Focus next
                  if (val && i < 5) {
                    const next = document.getElementById(`code-input-${i+1}`);
                    if (next) (next as HTMLInputElement).focus();
                  }
                }}
                id={`code-input-${i}`}
                autoFocus={i === 0}
                disabled={loading}
                onKeyDown={e => {
                  if (e.key === 'Backspace' && !code[i] && i > 0) {
                    const prev = document.getElementById(`code-input-${i-1}`);
                    if (prev) (prev as HTMLInputElement).focus();
                  }
                }}
              />
            ))}
          </div>
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button type="submit" className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-3 rounded-full transition-colors" disabled={loading || code.length < 6}>
            {loading ? 'Verificando...' : 'Confirmar'}
          </button>
          <button type="button" className="w-full text-yellow-400 mt-2" onClick={() => setStep('phone')} disabled={loading}>Voltar</button>
        </form>
      )}
    </div>
  );
};

export default PhoneLoginForm;
