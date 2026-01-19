import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import Projects from "./Projects";

import DailyLogs from "./DailyLogs";

import Estimates from "./Estimates";

import Invoices from "./Invoices";

import Expenses from "./Expenses";

import TimeTracking from "./TimeTracking";

import Contacts from "./Contacts";

import Documents from "./Documents";

import Tasks from "./Tasks";

import Trades from "./Trades";

import Messages from "./Messages";

import ProjectThreads from "./ProjectThreads";

import Thread from "./Thread";

import MyProfile from "./MyProfile";

import Onboarding from "./Onboarding";

import ProjectDetail from "./ProjectDetail";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    Projects: Projects,
    
    DailyLogs: DailyLogs,
    
    Estimates: Estimates,
    
    Invoices: Invoices,
    
    Expenses: Expenses,
    
    TimeTracking: TimeTracking,
    
    Contacts: Contacts,
    
    Documents: Documents,
    
    Tasks: Tasks,
    
    Trades: Trades,
    
    Messages: Messages,
    
    ProjectThreads: ProjectThreads,
    
    Thread: Thread,
    
    MyProfile: MyProfile,
    
    Onboarding: Onboarding,
    
    ProjectDetail: ProjectDetail,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/Projects" element={<Projects />} />
                
                <Route path="/DailyLogs" element={<DailyLogs />} />
                
                <Route path="/Estimates" element={<Estimates />} />
                
                <Route path="/Invoices" element={<Invoices />} />
                
                <Route path="/Expenses" element={<Expenses />} />
                
                <Route path="/TimeTracking" element={<TimeTracking />} />
                
                <Route path="/Contacts" element={<Contacts />} />
                
                <Route path="/Documents" element={<Documents />} />
                
                <Route path="/Tasks" element={<Tasks />} />
                
                <Route path="/Trades" element={<Trades />} />
                
                <Route path="/Messages" element={<Messages />} />
                
                <Route path="/ProjectThreads" element={<ProjectThreads />} />
                
                <Route path="/Thread" element={<Thread />} />
                
                <Route path="/MyProfile" element={<MyProfile />} />
                
                <Route path="/Onboarding" element={<Onboarding />} />
                
                <Route path="/ProjectDetail" element={<ProjectDetail />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}