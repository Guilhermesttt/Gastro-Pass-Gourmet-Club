import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SUBSCRIPTION_PLANS, SubscriptionPlan } from '@/lib/subscriptionService';

interface SubscriptionBenefitsProps {
  planId: SubscriptionPlan;
  expirationDate?: string;
}

export const SubscriptionBenefits: React.FC<SubscriptionBenefitsProps> = ({
  planId,
  expirationDate
}) => {
  const benefits = SUBSCRIPTION_PLANS[planId];
  const isExpired = expirationDate ? new Date(expirationDate) < new Date() : false;

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-2xl capitalize">{planId}</CardTitle>
            <CardDescription>
              {isExpired ? 'Assinatura expirada' : `Válido até ${new Date(expirationDate!).toLocaleDateString()}`}
            </CardDescription>
          </div>
          <Badge variant={isExpired ? 'destructive' : 'default'}>
            {isExpired ? 'Expirado' : 'Ativo'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold">Acesso a Restaurantes</h3>
              <p className="text-sm text-gray-500">
                {benefits.accessRestaurants === -1
                  ? 'Acesso a todos os restaurantes'
                  : `${benefits.accessRestaurants} restaurantes`}
              </p>
            </div>
            <div>
              <h3 className="font-semibold">Desconto</h3>
              <p className="text-sm text-gray-500">
                {benefits.discountPercentage}% em todos os restaurantes
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold">Suporte</h3>
              <p className="text-sm text-gray-500">
                {benefits.supportType === '24/7'
                  ? 'Suporte 24/7'
                  : benefits.supportType === 'prioritario'
                  ? 'Suporte prioritário'
                  : 'Suporte por email'}
              </p>
            </div>
            <div>
              <h3 className="font-semibold">Cupons</h3>
              <p className="text-sm text-gray-500">
                {benefits.couponsFrequency === 'semanal'
                  ? 'Cupons semanais'
                  : benefits.couponsFrequency === 'mensal'
                  ? 'Cupons mensais'
                  : 'Sem cupons'}
              </p>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold">Valor</h3>
            <p className="text-2xl font-bold">
              R$ {benefits.price.toFixed(2)}
              <span className="text-sm font-normal text-gray-500">/mês</span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 