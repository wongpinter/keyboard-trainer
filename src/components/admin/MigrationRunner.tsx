import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Database, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { migrateTrainingData, MigrationResult } from '@/scripts/migrateTrainingData';

export const MigrationRunner: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const runDryRun = async () => {
    setIsRunning(true);
    setResult(null);
    setLogs([]);
    
    try {
      addLog('Starting dry run migration...');
      const migrationResult = await migrateTrainingData({ dryRun: true });
      setResult(migrationResult);
      addLog(`Dry run completed. Would migrate ${migrationResult.migratedCount} items.`);
    } catch (error) {
      addLog(`Dry run failed: ${error}`);
      setResult({
        success: false,
        migratedCount: 0,
        errors: [String(error)],
        warnings: []
      });
    } finally {
      setIsRunning(false);
    }
  };

  const runMigration = async () => {
    setIsRunning(true);
    setResult(null);
    setLogs([]);
    
    try {
      addLog('Starting actual migration...');
      const migrationResult = await migrateTrainingData({ overwrite: false });
      setResult(migrationResult);
      
      if (migrationResult.success) {
        addLog(`Migration completed successfully! Migrated ${migrationResult.migratedCount} items.`);
      } else {
        addLog(`Migration completed with errors. Check the results below.`);
      }
    } catch (error) {
      addLog(`Migration failed: ${error}`);
      setResult({
        success: false,
        migratedCount: 0,
        errors: [String(error)],
        warnings: []
      });
    } finally {
      setIsRunning(false);
    }
  };

  const runMigrationWithOverwrite = async () => {
    setIsRunning(true);
    setResult(null);
    setLogs([]);
    
    try {
      addLog('Starting migration with overwrite...');
      const migrationResult = await migrateTrainingData({ overwrite: true });
      setResult(migrationResult);
      
      if (migrationResult.success) {
        addLog(`Migration with overwrite completed! Migrated ${migrationResult.migratedCount} items.`);
      } else {
        addLog(`Migration completed with errors. Check the results below.`);
      }
    } catch (error) {
      addLog(`Migration failed: ${error}`);
      setResult({
        success: false,
        migratedCount: 0,
        errors: [String(error)],
        warnings: []
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Training Data Migration
        </CardTitle>
        <CardDescription>
          Migrate training data from static files to Supabase database
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button 
            onClick={runDryRun} 
            disabled={isRunning}
            variant="outline"
          >
            {isRunning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Dry Run
          </Button>
          
          <Button 
            onClick={runMigration} 
            disabled={isRunning}
          >
            {isRunning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Run Migration
          </Button>
          
          <Button 
            onClick={runMigrationWithOverwrite} 
            disabled={isRunning}
            variant="destructive"
          >
            {isRunning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Run with Overwrite
          </Button>
        </div>

        {/* Migration Info */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Migration will create:</strong>
            <ul className="mt-2 ml-4 list-disc space-y-1">
              <li>Complete Colemak Training curriculum (40+ lessons)</li>
              <li>Specialized Colemak Basics curriculum</li>
              <li>Bigram Training curriculum for muscle memory</li>
              <li>Colemak-DH variant curriculum</li>
              <li>Advanced training curriculum</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* Logs */}
        {logs.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Migration Logs:</h3>
            <div className="bg-muted p-3 rounded-md max-h-40 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="text-sm font-mono">
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              <h3 className="text-lg font-semibold">
                Migration {result.success ? 'Successful' : 'Failed'}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-green-600">
                    {result.migratedCount}
                  </div>
                  <p className="text-sm text-muted-foreground">Items Migrated</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-red-600">
                    {result.errors.length}
                  </div>
                  <p className="text-sm text-muted-foreground">Errors</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-yellow-600">
                    {result.warnings.length}
                  </div>
                  <p className="text-sm text-muted-foreground">Warnings</p>
                </CardContent>
              </Card>
            </div>

            {/* Errors */}
            {result.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-red-600">Errors:</h4>
                <div className="space-y-1">
                  {result.errors.map((error, index) => (
                    <Alert key={index} variant="destructive">
                      <AlertDescription className="text-sm">
                        {error}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}

            {/* Warnings */}
            {result.warnings.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-yellow-600">Warnings:</h4>
                <div className="space-y-1">
                  {result.warnings.map((warning, index) => (
                    <Alert key={index}>
                      <AlertDescription className="text-sm">
                        {warning}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
