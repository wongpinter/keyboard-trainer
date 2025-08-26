import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { migrateTrainingData } from '@/scripts/migrateTrainingData';
import { 
  Database, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  FileText,
  Target
} from 'lucide-react';

interface MigrationLog {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export const CurriculumMigration: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<MigrationLog[]>([]);
  const [lastResult, setLastResult] = useState<any>(null);
  const { toast } = useToast();

  const addLog = (message: string, type: MigrationLog['type'] = 'info') => {
    const log: MigrationLog = {
      timestamp: new Date().toLocaleTimeString(),
      message,
      type
    };
    setLogs(prev => [...prev, log]);
  };

  const clearLogs = () => {
    setLogs([]);
    setLastResult(null);
  };

  const runMigration = async (validateOnly = false) => {
    setIsRunning(true);
    addLog(validateOnly ? '🔍 Starting validation...' : '🚀 Starting curriculum migration...');

    try {
      const result = await migrateTrainingData({
        dryRun: validateOnly,
        overwrite: true,
        validateOnly
      });

      setLastResult(result);

      if (result.success) {
        if (validateOnly) {
          addLog('✅ Validation completed successfully!', 'success');
          addLog('📋 Curriculum data is ready for migration', 'success');
        } else {
          addLog('✅ Migration completed successfully!', 'success');
          addLog(`📊 Migrated ${result.migratedCount} curriculums`, 'success');
        }
        
        if (result.warnings.length > 0) {
          addLog('⚠️ Warnings found:', 'warning');
          result.warnings.forEach(warning => addLog(`   - ${warning}`, 'warning'));
        }

        toast({
          title: validateOnly ? "Validation Complete" : "Migration Complete",
          description: validateOnly 
            ? "Curriculum data validation passed successfully"
            : `Successfully migrated ${result.migratedCount} curriculums`,
        });
      } else {
        addLog(validateOnly ? '❌ Validation failed!' : '❌ Migration failed!', 'error');
        if (result.errors.length > 0) {
          addLog('🔥 Errors:', 'error');
          result.errors.forEach(error => addLog(`   - ${error}`, 'error'));
        }

        toast({
          title: validateOnly ? "Validation Failed" : "Migration Failed",
          description: "Check the logs for details",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      addLog(`💥 ${validateOnly ? 'Validation' : 'Migration'} script failed: ${error.message}`, 'error');
      toast({
        title: "Script Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getLogIcon = (type: MigrationLog['type']) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <FileText className="h-4 w-4 text-blue-500" />;
    }
  };

  const getLogColor = (type: MigrationLog['type']) => {
    switch (type) {
      case 'success': return 'text-green-700';
      case 'warning': return 'text-yellow-700';
      case 'error': return 'text-red-700';
      default: return 'text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Curriculum Migration Tool
          </CardTitle>
          <CardDescription>
            Export static training curriculum data from the codebase to the Supabase database.
            This will create comprehensive Colemak training curriculums with all lessons and content.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Target className="h-4 w-4" />
            <AlertDescription>
              <strong>What this does:</strong> Converts all static curriculum data in <code>src/data/colemakTraining.ts</code> 
              into database records, creating 5 comprehensive curriculums with 40+ lessons covering words, sentences, 
              bigrams, and Colemak-DH variants.
            </AlertDescription>
          </Alert>

          <div className="flex gap-3">
            <Button 
              onClick={() => runMigration(false)}
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              {isRunning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Export to Database
            </Button>

            <Button 
              variant="outline"
              onClick={() => runMigration(true)}
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              {isRunning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Validate Only
            </Button>

            <Button 
              variant="ghost"
              onClick={clearLogs}
              disabled={isRunning || logs.length === 0}
            >
              Clear Logs
            </Button>
          </div>

          {lastResult && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{lastResult.migratedCount}</div>
                <div className="text-sm text-muted-foreground">Migrated</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{lastResult.warnings.length}</div>
                <div className="text-sm text-muted-foreground">Warnings</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{lastResult.errors.length}</div>
                <div className="text-sm text-muted-foreground">Errors</div>
              </div>
              <div className="text-center">
                <Badge variant={lastResult.success ? "default" : "destructive"}>
                  {lastResult.success ? "Success" : "Failed"}
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Migration Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto font-mono text-sm">
              {logs.map((log, index) => (
                <div key={index} className={`flex items-start gap-2 ${getLogColor(log.type)}`}>
                  {getLogIcon(log.type)}
                  <span className="text-xs text-muted-foreground">[{log.timestamp}]</span>
                  <span className="flex-1">{log.message}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
