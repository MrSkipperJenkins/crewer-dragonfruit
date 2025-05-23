import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Layout from "@/components/layout/layout";
import Dashboard from "@/pages/dashboard";
import Shows from "@/pages/shows";
import ShowsCalendarView from "@/pages/shows/calendar-view";
import ShowsListView from "@/pages/shows/list-view";
import ShowBuilder from "@/pages/shows/show-builder";
import CrewMembers from "@/pages/crew-members";
import CrewSchedule from "@/pages/crew-schedule";
import Jobs from "@/pages/jobs";
import Resources from "@/pages/resources";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import Notifications from "@/pages/notifications";
import { WorkspaceProvider } from "@/hooks/use-workspace.tsx";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/shows" component={Shows} />
        <Route path="/shows/calendar" component={ShowsCalendarView} />
        <Route path="/shows/list" component={ShowsListView} />
        <Route path="/shows/builder" component={ShowBuilder} />
        <Route path="/crew-members" component={CrewMembers} />
        <Route path="/crew-schedule" component={CrewSchedule} />
        <Route path="/jobs" component={Jobs} />
        <Route path="/resources" component={Resources} />
        <Route path="/reports" component={Reports} />
        <Route path="/notifications" component={Notifications} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WorkspaceProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </WorkspaceProvider>
    </QueryClientProvider>
  );
}

export default App;
