import React, { useState, useMemo } from 'react';
import { 
  Trophy, 
  Flame, 
  Zap, 
  Award, 
  Crown, 
  GraduationCap,
  Filter,
  Medal
} from 'lucide-react';
import { StudentProfile, LeaderboardUser } from '../../types';
import { sampleLeaderboard } from '../../data/mockData';

interface LeaderboardViewProps {
  profile: StudentProfile;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({ profile }) => {
  const [filterScope, setFilterScope] = useState<'all' | 'college' | 'tier1'>('all');

  const combinedLeaderboard = useMemo(() => {
    const list = [...sampleLeaderboard];
    // Check if current user is in list, or inject current profile
    const existingIdx = list.findIndex(u => u.name === profile.name || u.id === profile.id);
    const currentUserEntry: LeaderboardUser = {
      id: profile.id || 'stu-101',
      rank: 4,
      name: `${profile.name} (You)`,
      college: profile.college || 'National Institute of Technology',
      avatar: '👩‍💻',
      xpPoints: profile.xpPoints || 3250,
      streakDays: profile.streakDays || 12,
      readinessScore: profile.readinessScore || 85,
      badgeCount: profile.badges.filter(b => b.unlocked).length || 5,
    };

    if (existingIdx !== -1) {
      list[existingIdx] = currentUserEntry;
    } else {
      list.push(currentUserEntry);
    }

    // Sort by XP descending
    list.sort((a, b) => b.xpPoints - a.xpPoints);

    // Re-assign ranks
    return list.map((item, idx) => ({
      ...item,
      rank: idx + 1,
    }));
  }, [profile]);

  const filteredList = useMemo(() => {
    if (filterScope === 'college') {
      return combinedLeaderboard.filter(u => u.college.includes('National Institute') || u.name.includes('(You)'));
    }
    if (filterScope === 'tier1') {
      return combinedLeaderboard.filter(u => u.readinessScore >= 85);
    }
    return combinedLeaderboard;
  }, [combinedLeaderboard, filterScope]);

  const userCurrentRank = combinedLeaderboard.find(u => u.name.includes('(You)'))?.rank || 4;

  return (
    <div className="space-y-8 font-sans">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-slate-900" />
            Campus Placement Leaderboard & Hall of Fame
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Compare placement preparation momentum and XP points across engineering colleges.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-xs text-xs font-semibold">
            <button
              onClick={() => setFilterScope('all')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                filterScope === 'all' ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Colleges
            </button>
            <button
              onClick={() => setFilterScope('college')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                filterScope === 'college' ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              My Campus (NIT)
            </button>
            <button
              onClick={() => setFilterScope('tier1')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                filterScope === 'tier1' ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dream Offer (85%+)
            </button>
          </div>

          <span className="text-xs px-3.5 py-2 rounded-xl bg-slate-900 text-white font-bold flex items-center gap-1.5 shadow-xs">
            <Crown className="w-4 h-4 text-amber-400 fill-amber-400" /> Your Rank: #{userCurrentRank}
          </span>
        </div>
      </div>

      {/* Top 3 Podium Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        {filteredList.slice(0, 3).map((user, idx) => {
          const podiumLabels = ['1st Place - Campus Topper', '2nd Place', '3rd Place'];
          const isWinner = idx === 0;

          return (
            <div
              key={user.id}
              className={`rounded-3xl bg-white border p-6 flex flex-col items-center text-center space-y-3 relative overflow-hidden shadow-xs transition ${
                isWinner ? 'border-slate-900 ring-2 ring-slate-900' : 'border-slate-200'
              }`}
            >
              <div className="text-4xl mb-1">{user.avatar}</div>
              <div className={`px-3 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                isWinner ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-800'
              }`}>
                {podiumLabels[idx]}
              </div>
              <div>
                <h4 className="font-extrabold text-base text-slate-900">{user.name}</h4>
                <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-slate-600" /> {user.college}
                </p>
              </div>

              <div className="flex items-center justify-center gap-4 text-xs pt-3 border-t border-slate-100 w-full">
                <span className="font-bold text-slate-900 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" /> {user.xpPoints.toLocaleString()} XP
                </span>
                <span className="font-bold text-slate-700 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> {user.streakDays}d Streak
                </span>
                <span className="font-extrabold text-slate-900">
                  {user.readinessScore}% Ready
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Full Leaderboard Table */}
      <div className="rounded-3xl bg-white border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Medal className="w-4 h-4 text-slate-700" />
            Recruitment Batch Preparedness Ranking
          </span>
          <span className="text-xs text-slate-500 font-semibold">Live Real-time XP & Readiness Standings</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-800">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-bold text-[10px]">
              <tr>
                <th className="px-5 py-3">Rank</th>
                <th className="px-5 py-3">Candidate</th>
                <th className="px-5 py-3">Institution</th>
                <th className="px-5 py-3">XP Points</th>
                <th className="px-5 py-3">Consistency Streak</th>
                <th className="px-5 py-3">Placement Readiness</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredList.map((usr) => {
                const isCurrentUser = usr.name.includes('(You)');
                return (
                  <tr key={usr.id} className={`transition ${isCurrentUser ? 'bg-amber-50/70 font-bold' : 'hover:bg-slate-50'}`}>
                    <td className="px-5 py-3.5 font-black text-slate-900">#{usr.rank}</td>
                    <td className="px-5 py-3.5 font-bold text-slate-900 flex items-center gap-2">
                      <span className="text-base">{usr.avatar}</span>
                      <span>{usr.name}</span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{usr.college}</td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">{usr.xpPoints.toLocaleString()} XP</td>
                    <td className="px-5 py-3.5 text-slate-700">{usr.streakDays} Days</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full font-extrabold text-[10px] ${
                        usr.readinessScore >= 85
                          ? 'bg-emerald-100 text-emerald-800'
                          : usr.readinessScore >= 75
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}>
                        {usr.readinessScore}% Ready
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
