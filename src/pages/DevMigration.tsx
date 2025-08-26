import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MigrationRunner } from '@/components/admin/MigrationRunner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle } from 'lucide-react';

/**
 * Developer-only migration page
 * Only accessible in development environment or with special access
 */
export default function DevMigration() {
  const navigate = useNavigate();
  const [hasAccess, setHasAccess] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check if user has access to migration functionality
    const checkAccess = () => {
      // Only allow access in development environment
      const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
      
      // Or if explicitly enabled via environment variable
      const migrationEnabled = import.meta.env.VITE_ENABLE_MIGRATION === 'true';
      
      // Or if accessing via localhost (development)
      const isLocalhost = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1';

      const hasAccess = isDevelopment || migrationEnabled || isLocalhost;
      
      if (!hasAccess) {
        console.warn('Migration access denied - not in development environment');
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      }
      
      setHasAccess(hasAccess);
      setIsChecking(false);
    };

    checkAccess();
  }, [navigate]);

  if (isChecking) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Checking access permissions...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <Shield className="w-5 h-5" />
              Access Denied
            </CardTitle>
            <CardDescription>
              Migration functionality is restricted to development environments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Unauthorized Access Attempt</strong>
                <br />
                Database migration functionality is only available to developers in development environments.
                You will be redirected to the dashboard shortly.
              </AlertDescription>
            </Alert>
            
            <div className="mt-6 space-y-2">
              <h4 className="font-semibold">For Developers:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Ensure you're running in development mode</li>
                <li>• Set <code>VITE_ENABLE_MIGRATION=true</code> in your .env file</li>
                <li>• Access via localhost during development</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Database Migration</h1>
        <p className="text-muted-foreground mt-2">
          Developer tool for migrating training data to Supabase database
        </p>
      </div>

      <Alert className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Developer Environment Detected</strong>
          <br />
          This migration tool is only available in development environments. 
          It will not be accessible in production builds.
        </AlertDescription>
      </Alert>

      <MigrationRunner />
      
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Migration Guidelines</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Before Running Migration:</h4>
              <ul className="text-sm space-y-1 ml-4 list-disc">
                <li>Ensure Supabase is properly configured</li>
                <li>Verify database connection is working</li>
                <li>Run a dry run first to preview changes</li>
                <li>Backup existing data if necessary</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">After Migration:</h4>
              <ul className="text-sm space-y-1 ml-4 list-disc">
                <li>Verify all curriculums were created correctly</li>
                <li>Test lesson loading and content generation</li>
                <li>Update application to use database instead of static data</li>
                <li>Remove or secure migration endpoints for production</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
