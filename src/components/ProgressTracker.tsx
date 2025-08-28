import { useTranslation } from 'react-i18next';
import { TypingStats } from '@/types/keyboard';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ProgressTrackerProps {
  stats: TypingStats;
  targetWpm?: number;
  targetAccuracy?: number;
  lessonProgress?: number;
}

const ProgressTracker = ({
  stats,
  targetWpm = stats.wpm > 0 ? Math.max(30, stats.wpm + 5) : 30,
  targetAccuracy = stats.accuracy > 0 ? Math.max(95, stats.accuracy + 2) : 95,
  lessonProgress = 0
}: ProgressTrackerProps) => {
  const { t } = useTranslation(['training', 'common']);
  const wpmProgress = Math.min((stats.wpm / targetWpm) * 100, 100);
  const accuracyProgress = Math.min((stats.accuracy / targetAccuracy) * 100, 100);

  const getProgressColor = (value: number, threshold: number = 75) => {
    if (value >= threshold) return 'success';
    if (value >= threshold * 0.7) return 'learning';
    return 'destructive';
  };

  const StatCard = ({ title, value, unit, progress, target }: {
    title: string;
    value: number;
    unit: string;
    progress: number;
    target: number;
  }) => (
    <Card className="p-4">
      <div className="text-center mb-2">
        <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
        <div className="text-2xl font-bold">
          {value}
          <span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>
        </div>
        <div className="text-xs text-muted-foreground">
          {t('training:progress.target', { target, unit })}
        </div>
      </div>
      <Progress 
        value={progress} 
        className={cn("h-2", getProgressColor(progress) === 'success' && "[&>*]:bg-success", 
                      getProgressColor(progress) === 'learning' && "[&>*]:bg-learning",
                      getProgressColor(progress) === 'destructive' && "[&>*]:bg-destructive")}
      />
    </Card>
  );

  return (
    <div className="space-y-4">
      {/* Current Session Stats */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          title={t('training:progress.speed')}
          value={stats.wpm}
          unit={t('common:units.wpm')}
          progress={wpmProgress}
          target={targetWpm}
        />
        <StatCard
          title={t('training:progress.accuracy')}
          value={stats.accuracy}
          unit="%"
          progress={accuracyProgress}
          target={targetAccuracy}
        />
      </div>

      {/* Lesson Progress */}
      <Card className="p-4">
        <div className="mb-2">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-medium text-muted-foreground">{t('training:progress.lessonProgress')}</h4>
            <span className="text-sm text-muted-foreground">{lessonProgress}%</span>
          </div>
        </div>
        <Progress 
          value={lessonProgress} 
          className="h-3"
        />
      </Card>

      {/* Detailed Stats */}
      <Card className="p-4">
        <h4 className="text-sm font-medium text-muted-foreground mb-3">{t('training:progress.sessionDetails')}</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">{t('training:progress.characters')}</span>
            <span className="ml-2 font-medium">{stats.totalCharacters}</span>
          </div>
          <div>
            <span className="text-muted-foreground">{t('training:progress.errors')}</span>
            <span className="ml-2 font-medium text-destructive">{stats.incorrectCharacters}</span>
          </div>
          <div>
            <span className="text-muted-foreground">{t('training:progress.correct')}</span>
            <span className="ml-2 font-medium text-success">{stats.correctCharacters}</span>
          </div>
          <div>
            <span className="text-muted-foreground">{t('training:progress.time')}</span>
            <span className="ml-2 font-medium">
              {stats.startTime ?
                t('training:progress.timeFormat', { seconds: Math.floor(((stats.endTime || Date.now()) - stats.startTime) / 1000) }) :
                t('training:progress.timeFormat', { seconds: 0 })
              }
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ProgressTracker;