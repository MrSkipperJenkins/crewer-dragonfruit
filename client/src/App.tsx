import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { WorkspaceLayout } from "@/components/layout/workspace-layout";
import Dashboard from "@/pages/dashboard";
import RegisterPage from "@/pages/auth/register";
import LoginPage from "@/pages/auth/login";
import WorkspacesPage from "@/pages/workspaces";
import Shows from "@/pages/shows";
import ShowsCalendarView from "@/pages/shows/calendar-view";
import ShowsListView from "@/pages/shows/list-view";
import ShowBuilder from "@/pages/shows/show-builder";
import EditShow from "@/pages/shows/edit";
import ShowTemplates from "@/pages/shows/templates";
import Productions from "@/pages/productions";
import ShowTemplatesNew from "@/pages/show-templates";
import Landing from "@/pages/landing";
import Onboarding from "@/pages/onboarding";
import CrewMembers from "@/pages/crew-members";
import CrewSchedule from "@/pages/crew-schedule";
import Jobs from "@/pages/jobs";
import Resources from "@/pages/resources";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import Notifications from "@/pages/notifications";
import NewWorkspacePage from "@/pages/workspaces/new";
import { CurrentWorkspaceProvider } from "@/hooks/use-current-workspace";

function Router() {
  return (
    <Switch>
      {/* Authentication routes */}
      <Route path="/register" component={RegisterPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/workspaces" component={WorkspacesPage} />

      {/* Standalone routes (outside workspace layout) */}
      <Route path="/landing" component={Landing} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/workspaces/new" component={NewWorkspacePage} />

      {/* Workspace-aware routes */}
      <Route>
        <CurrentWorkspaceProvider>
          <WorkspaceLayout>
            <Switch>
              {/* Legacy routes (for backwards compatibility) */}
              <Route path="/" component={Dashboard} />
              <Route path="/shows" component={Shows} />
              <Route path="/shows/calendar" component={ShowsCalendarView} />
              <Route path="/shows/list" component={ShowsListView} />
              <Route path="/shows/templates" component={ShowTemplates} />
              <Route path="/shows/:id/edit" component={EditShow} />
              <Route path="/shows/builder" component={ShowBuilder} />
              <Route path="/crew-members" component={CrewMembers} />
              <Route path="/crew-schedule" component={CrewSchedule} />
              <Route path="/jobs" component={Jobs} />
              <Route path="/resources" component={Resources} />
              <Route path="/reports" component={Reports} />
              <Route path="/notifications" component={Notifications} />
              <Route path="/settings" component={Settings} />

              {/* Workspace-specific routes */}
              <Route path="/workspaces/:slug" component={Dashboard} />
              <Route path="/workspaces/:slug/dashboard" component={Dashboard} />
              <Route
                path="/workspaces/:slug/productions"
                component={Productions}
              />
              <Route path="/workspaces/:slug/shows" component={Shows} />
              <Route
                path="/workspaces/:slug/shows/calendar"
                component={ShowsCalendarView}
              />
              <Route
                path="/workspaces/:slug/shows/list"
                component={ShowsListView}
              />
              <Route
                path="/workspaces/:slug/shows/:id/edit"
                component={EditShow}
              />
              <Route
                path="/workspaces/:slug/shows/builder"
                component={ShowBuilder}
              />
              <Route
                path="/workspaces/:slug/shows/templates"
                component={ShowTemplates}
              />
              <Route
                path="/workspaces/:slug/templates"
                component={ShowTemplatesNew}
              />
              <Route
                path="/workspaces/:slug/crew-members"
                component={CrewMembers}
              />
              <Route
                path="/workspaces/:slug/crew-schedule"
                component={CrewSchedule}
              />
              <Route path="/workspaces/:slug/jobs" component={Jobs} />
              <Route path="/workspaces/:slug/resources" component={Resources} />
              <Route path="/workspaces/:slug/reports" component={Reports} />
              <Route
                path="/workspaces/:slug/notifications"
                component={Notifications}
              />
              <Route path="/workspaces/:slug/settings" component={Settings} />

              <Route component={NotFound} />
            </Switch>
          </WorkspaceLayout>
        </CurrentWorkspaceProvider>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
