import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import Home from "./pages/Home";
import MatchDetail from "./pages/MatchDetail";
import Matches from "./pages/Matches";
import Analysis from "./pages/Analysis";
import Topics from "./pages/Topics";
import TopicDetail from "./pages/TopicDetail";
import CreateTopic from "./pages/CreateTopic";
import MatchUpload from "./pages/MatchUpload";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import DiscordSettings from "./pages/DiscordSettings";
import DashboardPage from "./pages/DashboardPage";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/dashboard"} component={DashboardPage} />
      <Route path={"/matches"} component={Matches} />
      <Route path={"/match/:id"} component={MatchDetail} />
      <Route path={"/analysis/:matchId"} component={Analysis} />
      <Route path={"/topics"} component={Topics} />
      <Route path={"/topic/:topicId"} component={TopicDetail} />
      <Route path="/create-topic" component={CreateTopic} />
      <Route path="/match-upload" component={MatchUpload} />
      <Route path="/profile" component={Profile} />
      <Route path={"/settings"} component={Settings} />
      <Route path={"/discord-settings"} component={DiscordSettings} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <ThemeProvider
          defaultTheme="dark"
          // switchable
        >
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

export default App;
