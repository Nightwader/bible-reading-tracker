import React, { useState, useEffect } from 'react';
import { Calendar, Users, BookOpen, Trophy, Bell, User, Settings, CheckCircle, Circle, BarChart3, LogOut } from 'lucide-react';
import { supabase } from './supabaseClient';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [userProfile, setUserProfile] = useState(null);
  const [dailyReadings, setDailyReadings] = useState([]);
  const [readingLogs, setReadingLogs] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);

  // Auth state listener
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load user data when user changes
  useEffect(() => {
    if (user) {
      loadUserData();
      loadDailyReadings();
      loadAnnouncements();
      loadLeaderboard();
    }
  }, [user]);

  const loadUserData = async () => {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    setUserProfile(profile);

    const { data: logs } = await supabase
      .from('reading_logs')
      .select('*')
      .eq('user_id', user.id);
    
    setReadingLogs(logs || []);
  };

  const loadDailyReadings = async () => {
    const { data } = await supabase
      .from('daily_readings')
      .select('*')
      .order('date', { ascending: false })
      .limit(10);
    
    setDailyReadings(data || []);
  };

  const loadAnnouncements = async () => {
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(5);
    
    setAnnouncements(data || []);
  };

  const loadLeaderboard = async () => {
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .order('chapters_read', { ascending: false });
    
    setLeaderboard(data || []);
  };

  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
  };

  const signUp = async (email, password, name) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }
      }
    });
    if (error) alert(error.message);
    else alert('Check your email for confirmation link!');
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setCurrentPage('dashboard');
  };

  const toggleReadingComplete = async (readingId) => {
    const existingLog = readingLogs.find(log => log.reading_id === readingId);
    
    if (existingLog) {
      const { error } = await supabase
        .from('reading_logs')
        .update({ 
          completed: !existingLog.completed,
          completed_at: !existingLog.completed ? new Date().toISOString() : null
        })
        .eq('id', existingLog.id);
      
      if (!error) loadUserData();
    } else {
      const { error } = await supabase
        .from('reading_logs')
        .insert({
          user_id: user.id,
          reading_id: readingId,
          completed: true,
          completed_at: new Date().toISOString()
        });
      
      if (!error) loadUserData();
    }
  };

  const isReadingComplete = (readingId) => {
    const log = readingLogs.find(log => log.reading_id === readingId);
    return log?.completed || false;
  };

  const getUserStats = () => {
    if (!userProfile) return { chaptersRead: 0, chaptersRemaining: 1189, chaptersMissed: 0, completionPercentage: 0 };
    
    const totalChapters = 1189;
    const chaptersRead = userProfile.chapters_read;
    const chaptersRemaining = totalChapters - chaptersRead;
    const chaptersMissed = userProfile.chapters_missed;
    const completionPercentage = ((chaptersRead / totalChapters) * 100).toFixed(1);
    
    return { chaptersRead, chaptersRemaining, chaptersMissed, completionPercentage };
  };

  // Auth component
  const AuthComponent = () => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');

    const handleSubmit = (e) => {
      e.preventDefault();
      if (isSignUp) {
        signUp(email, password, name);
      } else {
        signIn(email, password);
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <BookOpen className="mx-auto h-12 w-12 text-indigo-600 mb-4" />
            <h1 className="text-3xl font-bold text-gray-900">Bible Reading Tracker</h1>
            <p className="text-gray-600 mt-2">Track your daily Bible reading journey</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </button>
            <p className="text-center text-sm text-gray-600">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-indigo-600 hover:text-indigo-800"
              >
                {isSignUp ? 'Sign in here' : 'Register here'}
              </button>
            </p>
          </form>
        </div>
      </div>
    );
  };

  // Navigation
  const Navigation = () => (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <BookOpen className="h-8 w-8 text-indigo-600" />
            <span className="ml-2 text-xl font-semibold text-gray-900">Bible Tracker</span>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => setCurrentPage('dashboard')}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                currentPage === 'dashboard' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setCurrentPage('calendar')}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                currentPage === 'calendar' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Calendar
            </button>
            <button
              onClick={() => setCurrentPage('community')}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                currentPage === 'community' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Community
            </button>
          </div>
          <div className="flex items-center">
            <span className="text-sm text-gray-700 mr-4">Welcome, {userProfile?.name}</span>
            <button
              onClick={signOut}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
            >
              <LogOut className="h-4 w-4 mr-1" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );

  // Dashboard Page
  const Dashboard = () => {
    const stats = getUserStats();
    const todayReading = dailyReadings[0];
    
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your Reading Dashboard</h1>
          <p className="text-gray-600 mt-2">Track your daily Bible reading progress</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Chapters Read</p>
                <p className="text-2xl font-bold text-gray-900">{stats.chaptersRead}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Remaining</p>
                <p className="text-2xl font-bold text-gray-900">{stats.chaptersRemaining}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Circle className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Missed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.chaptersMissed}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Progress</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completionPercentage}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Reading */}
        {todayReading && (
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="px-6 py-4 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Today's Reading</h2>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{todayReading.title}</h3>
                  <p className="text-gray-600">{todayReading.passage}</p>
                  <p className="text-sm text-gray-500">{todayReading.date}</p>
                </div>
                <button
                  onClick={() => toggleReadingComplete(todayReading.id)}
                  className={`flex items-center px-4 py-2 rounded-md ${
                    isReadingComplete(todayReading.id)
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {isReadingComplete(todayReading.id) ? (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Completed
                    </>
                  ) : (
                    <>
                      <Circle className="h-5 w-5 mr-2" />
                      Mark Complete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Recent Announcements */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Recent Announcements</h2>
          </div>
          <div className="p-6">
            {announcements.slice(0, 2).map(announcement => (
              <div key={announcement.id} className="mb-4 last:mb-0">
                <div className="flex items-start">
                  <Bell className="h-5 w-5 text-indigo-500 mt-0.5 mr-3" />
                  <div>
                    <h3 className="font-medium text-gray-900">{announcement.title}</h3>
                    <p className="text-gray-600 text-sm mt-1">{announcement.content}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(announcement.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Calendar Page
  const CalendarPage = () => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Reading Calendar</h1>
        <p className="text-gray-600 mt-2">View and track your daily readings</p>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Recent Readings</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {dailyReadings.map(reading => (
              <div key={reading.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">{reading.title}</h3>
                  <p className="text-gray-600">{reading.passage}</p>
                  <p className="text-sm text-gray-500">{reading.date}</p>
                </div>
                <button
                  onClick={() => toggleReadingComplete(reading.id)}
                  className={`flex items-center px-4 py-2 rounded-md ${
                    isReadingComplete(reading.id)
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {isReadingComplete(reading.id) ? (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Completed
                    </>
                  ) : (
                    <>
                      <Circle className="h-5 w-5 mr-2" />
                      Mark Complete
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Community Page
  const CommunityPage = () => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Community</h1>
        <p className="text-gray-600 mt-2">See how everyone is progressing</p>
      </div>

      {/* Leaderboard */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Leaderboard</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {leaderboard.map((profile, index) => (
              <div key={profile.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold mr-4 ${
                    index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-600' : 'bg-gray-300'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{profile.name}</h3>
                    <p className="text-sm text-gray-600">{profile.chapters_read} chapters read</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Missed: {profile.chapters_missed}</p>
                  <p className="text-sm text-gray-600">
                    Progress: {((profile.chapters_read / 1189) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Announcements */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Community Announcements</h2>
        </div>
        <div className="p-6">
          {announcements.map(announcement => (
            <div key={announcement.id} className="mb-6 last:mb-0">
              <div className="flex items-start">
                <Bell className="h-5 w-5 text-indigo-500 mt-0.5 mr-3" />
                <div>
                  <h3 className="font-medium text-gray-900">{announcement.title}</h3>
                  <p className="text-gray-600 mt-1">{announcement.content}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(announcement.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-12 w-12 text-indigo-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthComponent />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      {currentPage === 'dashboard' && <Dashboard />}
      {currentPage === 'calendar' && <CalendarPage />}
      {currentPage === 'community' && <CommunityPage />}
    </div>
  );
}

export default App;