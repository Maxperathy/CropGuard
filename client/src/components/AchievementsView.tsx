import { Card } from './ui/Card';
import { Progress } from './ui/Progress';
import { Badge } from './ui/Badge';
import { Trophy, Award, Flame, Users } from 'lucide-react';

interface Achievement {
  id: string;
  name: string;
  desc: string;
  icon: string;
  color: string;
  unlocked: boolean;
}

const BADGES: Achievement[] = [
  { id: 'b1', name: 'First Diagnosis', desc: 'Successfully scanned your first infected crop leaf.', icon: '🛡️', color: 'border-amber-200 bg-amber-50 text-amber-600', unlocked: true },
  { id: 'b2', name: 'Photo Expert', desc: 'Uploaded 10 high-quality leaf specimens.', icon: '📸', color: 'border-emerald-200 bg-emerald-50 text-emerald-600', unlocked: true },
  { id: 'b3', name: 'Streak 7 Days', desc: 'Checked on your crop health 7 days in a row.', icon: '🔥', color: 'border-purple-200 bg-purple-50 text-purple-600', unlocked: true },
  { id: 'b4', name: 'Helping Hand', desc: 'Shared diagnosis results with another local farmer.', icon: '🤝', color: 'border-sky-200 bg-sky-50 text-sky-600', unlocked: true },
  { id: 'b5', name: 'Pest Exterminator', desc: 'Complete 5 insect pest diagnoses.', icon: '🐛', color: 'border-rose-200 bg-rose-50 text-rose-600', unlocked: false },
  { id: 'b6', name: 'Elite Advisor', desc: 'Earn 500 reputation points on the platform.', icon: '👑', color: 'border-yellow-200 bg-yellow-50 text-yellow-600', unlocked: false },
];

const LEADERBOARD = [
  { rank: 1, name: 'Ama Serwaa', points: 1420, level: 'Level 5' },
  { rank: 2, name: 'Kofi Osei', points: 980, level: 'Level 4' },
  { rank: 3, name: 'Maxwell Boateng', points: 760, level: 'Level 3' },
  { rank: 4, name: 'Kwame Mensah (You)', points: 435, level: 'Level 3', isUser: true },
  { rank: 5, name: 'Abena Mansa', points: 310, level: 'Level 2' },
];

interface AchievementsViewProps {
  reputationScore: number;
}

export function AchievementsView({ reputationScore }: AchievementsViewProps) {
  const currentXP = 420 + reputationScore;
  const level = Math.floor(currentXP / 300) + 1;
  const xpNeeded = level * 300;
  const prevLevelXp = (level - 1) * 300;
  const levelProgress = currentXP - prevLevelXp;
  const levelXpSpan = xpNeeded - prevLevelXp;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Profile Overview Card */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        <Card className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-6 pb-6 border-b border-zinc-100">
            <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center text-primary font-bold text-2xl shrink-0">
              KM
            </div>
            <div className="text-center md:text-left min-w-0">
              <h2 className="text-lg font-bold text-zinc-950 font-sans tracking-tight">Kwame Mensah</h2>
              <p className="text-xs text-zinc-500 font-medium mt-0.5">Kumasi District Farmer · Plant Protector</p>
              <div className="flex items-center justify-center md:justify-start gap-1.5 mt-2">
                <Badge variant="success">Level {level}</Badge>
                <span className="text-[10px] text-zinc-400 font-bold">Total reputation: {currentXP} points</span>
              </div>
            </div>
          </div>

          <div className="my-6">
            <div className="flex justify-between text-xs font-bold text-zinc-500 mb-1.5">
              <span>XP Progress</span>
              <span>{levelProgress} / {levelXpSpan} XP (to Level {level + 1})</span>
            </div>
            <Progress value={levelProgress} max={levelXpSpan} barClassName="bg-primary" />
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100">
              <Trophy className="w-5 h-5 text-amber-500 mx-auto mb-1" />
              <span className="text-[9px] text-zinc-400 uppercase font-bold block">Rank</span>
              <p className="text-base font-bold text-zinc-800 mt-0.5">#4</p>
            </div>
            <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100">
              <Flame className="w-5 h-5 text-purple-500 mx-auto mb-1" />
              <span className="text-[9px] text-zinc-400 uppercase font-bold block">Streak</span>
              <p className="text-base font-bold text-zinc-800 mt-0.5">7 Days</p>
            </div>
            <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100">
              <Award className="w-5 h-5 text-primary mx-auto mb-1" />
              <span className="text-[9px] text-zinc-400 uppercase font-bold block">Badges</span>
              <p className="text-base font-bold text-zinc-800 mt-0.5">4 / 6</p>
            </div>
          </div>
        </Card>

        {/* Badges details grid */}
        <Card className="p-6">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Achievements & Badges</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {BADGES.map((badge) => (
              <div
                key={badge.id}
                className={`p-3 rounded-2xl border flex gap-3 items-start transition-all ${
                  badge.unlocked
                    ? 'bg-white border-zinc-200/60 shadow-sm'
                    : 'bg-zinc-50/50 border-zinc-100 opacity-60'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg border shrink-0 ${badge.color}`}>
                  {badge.icon}
                </div>
                <div>
                  <h4 className={`text-xs font-bold ${badge.unlocked ? 'text-zinc-950' : 'text-zinc-400'}`}>
                    {badge.name}
                  </h4>
                  <p className="text-[10px] text-zinc-400 leading-normal font-medium mt-0.5">{badge.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Leaderboard Card */}
      <div className="lg:col-span-1">
        <Card className="p-5 flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-zinc-100 pb-3">
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-zinc-400" />
                <span>Regional Leaderboard</span>
              </h3>
            </div>

            <div className="flex flex-col gap-2">
              {LEADERBOARD.map((item) => (
                <div
                  key={item.rank}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                    item.isUser
                      ? 'bg-primary/5 border-primary/20 text-primary'
                      : 'bg-white border-zinc-100 text-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
                        item.rank === 1
                          ? 'bg-amber-400 text-white'
                          : item.rank === 2
                          ? 'bg-zinc-300 text-zinc-700'
                          : item.rank === 3
                          ? 'bg-amber-600 text-white'
                          : 'bg-zinc-50 text-zinc-400'
                      }`}
                    >
                      {item.rank}
                    </span>
                    <div className="min-w-0">
                      <h4 className={`text-xs font-bold leading-none ${item.isUser ? 'text-primary' : 'text-zinc-800'}`}>
                        {item.name}
                      </h4>
                      <span className="text-[9px] text-zinc-400 mt-0.5 block font-semibold">{item.level}</span>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold shrink-0">{item.points} pts</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[9px] text-zinc-400 text-center mt-6 font-medium leading-normal">
            * Complete diagnosis scans (+5 pts) and finish daily lesson units (+15 pts) to level up your ranking.
          </p>
        </Card>
      </div>
    </div>
  );
}
