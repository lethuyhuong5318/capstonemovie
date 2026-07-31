import { Percent, Gift, Users } from 'lucide-react';

const promos = [
  {
    icon: Percent,
    title: 'Giảm 20% suất chiếu sáng',
    description: 'Áp dụng cho tất cả suất chiếu trước 12h trưa, các ngày trong tuần.',
  },
  {
    icon: Gift,
    title: 'Combo bắp nước ưu đãi',
    description: 'Mua vé đặt trước qua CineWave, nhận ngay combo bắp nước giảm 15%.',
  },
  {
    icon: Users,
    title: 'Ưu đãi nhóm từ 4 vé',
    description: 'Đặt từ 4 vé trở lên trong cùng đơn hàng để nhận ưu đãi giá vé.',
  },
];

export default function PromotionsPage() {
  return (
    <div className="container-app py-8">
      <h1 className="mb-6 text-2xl font-semibold">Khuyến mãi</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {promos.map((p) => (
          <div key={p.title} className="rounded-lg border border-border bg-surface p-5">
            <p.icon className="mb-3 text-primary" size={28} />
            <h3 className="mb-1 font-semibold">{p.title}</h3>
            <p className="text-sm text-text-muted">{p.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
