import React, { useCallback, useEffect, useRef, useState } from 'react';
import { api, getStoredToken, setStoredToken } from './services/api.js';
import { DEFAULT_RESEARCH_FIELDS, setActiveFields } from './data/fields.js';
import { SceneryBg } from './components/SceneryBg.jsx';
import { AuthScreen } from './components/AuthScreen.jsx';
import { OpenWorldCity } from './components/OpenWorldCity.jsx';
import { HomeTab } from './components/HomeTab.jsx';
import { MentorStudio } from './components/MentorStudio.jsx';
import { RoundtableStudio } from './components/RoundtableStudio.jsx';
import { QuestsTab } from './components/QuestsTab.jsx';
import { TechTreeTab } from './components/TechTreeTab.jsx';
import { ProfileTab } from './components/ProfileTab.jsx';
import { AdminPanel } from './components/AdminPanel.jsx';
import { BottomNav } from './components/BottomNav.jsx';
import { DesktopSidebar } from './components/DesktopSidebar.jsx';
import { LegaciumLogo } from './components/LegaciumLogo.jsx';

export default function App() {
  const [booting, setBooting] = useState(true);
  const [user, setUser] = useState(null);
  const [meta, setMeta] = useState({
    season: 'ERA 01 · SEASON GENESIS',
    server_location: 'Kota Lab #01',
    ai_configured: false,
    active_model: 'gemini-2.5-flash'
  });

  // 'world' | 'home' | 'mentors' | 'roundtable' | 'quests' | 'techtree' | 'profile' | 'admin'
  const [activeTab, setActiveTab] = useState('world');
  const [returnTab, setReturnTab] = useState('world');
  const [selectedField, setSelectedField] = useState(null);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [selectedQuestId, setSelectedQuestId] = useState(null);

  // Simpan posisi terakhir avatar pemain di Dunia 3D Open World
  const playerPosRef = useRef({ x: 0, z: 9, yaw: Math.PI });

  const [fields, setFields] = useState(DEFAULT_RESEARCH_FIELDS);
  const [mentors, setMentors] = useState([]);
  const [quests, setQuests] = useState([]);
  const [recentContributions, setRecentContributions] = useState([]);
  const [myContributions, setMyContributions] = useState([]);
  const [techTree, setTechTree] = useState({ nodes: [], stats: {} });

  const loadGameData = useCallback(async () => {
    const [meRes, fieldRes, mentorRes, questRes, treeRes] = await Promise.all([
      api.getMe(),
      api.getFields().catch(() => ({ fields: DEFAULT_RESEARCH_FIELDS })),
      api.getMentors(),
      api.getQuests(),
      api.getTechTree()
    ]);

    setUser(meRes.user);
    if (meRes.meta) setMeta(meRes.meta);
    const loadedFields =
      Array.isArray(fieldRes?.fields) && fieldRes.fields.length > 0
        ? fieldRes.fields
        : DEFAULT_RESEARCH_FIELDS;
    setActiveFields(loadedFields);
    setFields(loadedFields);
    setMentors(mentorRes.mentors || []);
    setQuests(questRes.quests || []);
    setRecentContributions(questRes.recent_contributions || []);
    setMyContributions(questRes.my_contributions || []);
    setTechTree(treeRes);
  }, []);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setBooting(false);
      return;
    }
    loadGameData()
      .catch(() => {
        setStoredToken('');
        setUser(null);
      })
      .finally(() => setBooting(false));
  }, [loadGameData]);

  // Shortcut tombol Esc untuk langsung kembali ke Dunia 3D Open World
  useEffect(() => {
    const onEsc = (e) => {
      if (e.key === 'Escape' && user && activeTab !== 'world') {
        setActiveTab('world');
      }
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [user, activeTab]);

  async function handleAuthSuccess(loggedInUser) {
    setUser(loggedInUser);
    // Semua pemain langsung masuk ke Fullscreen 3D Open World Game!
    setActiveTab('world');
    try {
      await loadGameData();
    } catch {
      // ignore initial load error
    }
  }

  async function handleLogout() {
    try {
      await api.logout();
    } catch {
      // ignore
    }
    setStoredToken('');
    setUser(null);
    setActiveTab('world');
  }

  if (booting) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <SceneryBg />
        <div className="neo-card px-6 py-5 flex flex-col items-center gap-3">
          <LegaciumLogo size="lg" />
          <p className="text-sm font-extrabold animate-pulse">Memuat Dunia 3D Legacium...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onSuccess={handleAuthSuccess} />;
  }

  // MODE FULLSCREEN 3D OPEN WORLD GAME (100vw × 100vh tanpa sidebar menghalangi!)
  if (activeTab === 'world') {
    return (
      <OpenWorldCity
        user={user}
        fields={fields}
        mentors={mentors}
        quests={quests}
        playerPosRef={playerPosRef}
        onTalkToMentor={(mentor) => {
          setReturnTab('world');
          setSelectedMentor(mentor);
          setSelectedField(mentor.field);
          setActiveTab('mentors');
        }}
        onOpenRoundtable={() => {
          setReturnTab('world');
          setActiveTab('roundtable');
        }}
        onOpenQuests={() => {
          setReturnTab('world');
          setActiveTab('quests');
        }}
        onOpenTechTree={() => {
          setReturnTab('world');
          setActiveTab('techtree');
        }}
        onOpenDashboard={() => {
          setReturnTab('world');
          setActiveTab('home');
        }}
        onOpenProfile={() => {
          setReturnTab('world');
          setActiveTab('profile');
        }}
        onOpenAdmin={() => {
          setReturnTab('world');
          setActiveTab('admin');
        }}
      />
    );
  }

  const bottomTab =
    activeTab === 'mentors' || activeTab === 'roundtable'
      ? returnTab === 'world'
        ? 'world'
        : 'home'
      : activeTab === 'admin'
        ? 'profile'
        : activeTab;

  return (
    <div className="min-h-screen relative">
      <SceneryBg />

      <div className="w-full max-w-[1220px] mx-auto md:flex md:items-start md:gap-6 px-4 md:px-6 pt-4 md:py-5">
        <DesktopSidebar
          user={user}
          meta={meta}
          activeTab={activeTab}
          onChange={(tab) => {
            setActiveTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onLogout={handleLogout}
        />

        <main className="flex-1 min-w-0 max-w-[460px] md:max-w-none mx-auto md:mx-0">
          {activeTab === 'home' && (
            <HomeTab
              user={user}
              meta={meta}
              fields={fields}
              mentors={mentors}
              quests={quests}
              onSelectField={(fieldId) => {
                setReturnTab('home');
                setSelectedField(fieldId);
                setSelectedMentor(null);
                setActiveTab('mentors');
              }}
              onSelectMentor={(mentor) => {
                setReturnTab('home');
                setSelectedMentor(mentor);
                setSelectedField(mentor.field);
                setActiveTab('mentors');
              }}
              onOpenQuest={(quest) => {
                setSelectedQuestId(quest?.id || null);
                setActiveTab('quests');
              }}
              onOpenRoundtable={() => {
                setReturnTab('home');
                setActiveTab('roundtable');
              }}
              onOpenWorld={() => setActiveTab('world')}
              onOpenAdmin={() => setActiveTab('admin')}
            />
          )}

          {activeTab === 'mentors' && (
            <MentorStudio
              user={user}
              fields={fields}
              initialField={selectedField}
              initialMentor={selectedMentor}
              mentors={mentors}
              quests={quests}
              onBack={() => setActiveTab(returnTab)}
              onOpenRoundtable={() => setActiveTab('roundtable')}
              onOpenAdmin={() => setActiveTab('admin')}
              onLogout={handleLogout}
              onRefreshUser={loadGameData}
            />
          )}

          {activeTab === 'roundtable' && (
            <RoundtableStudio
              user={user}
              mentors={mentors}
              quests={quests}
              onBack={() => setActiveTab(returnTab)}
              onOpenAdmin={() => setActiveTab('admin')}
              onLogout={handleLogout}
              onReloadAll={loadGameData}
            />
          )}

          {activeTab === 'quests' && (
            <QuestsTab
              user={user}
              fields={fields}
              quests={quests}
              recentContributions={recentContributions}
              mentors={mentors}
              selectedQuestId={selectedQuestId}
              onOpenRoundtable={() => {
                setReturnTab('quests');
                setActiveTab('roundtable');
              }}
              onReload={loadGameData}
            />
          )}

          {activeTab === 'techtree' && (
            <TechTreeTab
              techTree={techTree}
              onOpenQuestById={(qId) => {
                setSelectedQuestId(qId);
                setActiveTab('quests');
              }}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileTab
              user={user}
              myContributions={myContributions}
              onOpenAdmin={() => setActiveTab('admin')}
              onLogout={handleLogout}
            />
          )}

          {activeTab === 'admin' && user.role === 'admin' && (
            <AdminPanel
              fields={fields}
              mentors={mentors}
              quests={quests}
              onBack={() => setActiveTab('world')}
              onReloadAll={loadGameData}
            />
          )}
        </main>
      </div>

      <BottomNav
        activeTab={bottomTab}
        onChange={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </div>
  );
}
