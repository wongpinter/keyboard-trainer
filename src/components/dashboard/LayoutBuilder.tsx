import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Plus, Save, Trash2, Edit, Eye, Code } from 'lucide-react';
import { KeyboardLayout } from '@/types/keyboard';

interface StoredLayout {
  id: string;
  name: string;
  description: string;
  layout_data: KeyboardLayout;
  is_public: boolean;
  created_at: string;
}

const LayoutBuilder = () => {
  const [layouts, setLayouts] = useState<StoredLayout[]>([]);
  const [editingLayout, setEditingLayout] = useState<StoredLayout | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Form state
  const [layoutName, setLayoutName] = useState('');
  const [layoutDescription, setLayoutDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [layoutData, setLayoutData] = useState<string>('');

  useEffect(() => {
    fetchLayouts();
  }, []);

  const fetchLayouts = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data, error } = await supabase
        .from('keyboard_layouts')
        .select('*')
        .or(`created_by.eq.${user.user.id},is_public.eq.true`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLayouts((data || []).map(layout => ({
        ...layout,
        layout_data: typeof layout.layout_data === 'string' 
          ? JSON.parse(layout.layout_data) 
          : (layout.layout_data as unknown) as KeyboardLayout
      })));
    } catch (error: any) {
      toast({
        title: "Error loading layouts",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setLayoutName('');
    setLayoutDescription('');
    setIsPublic(false);
    setLayoutData('');
    setEditingLayout(null);
    setIsCreating(false);
  };

  const startCreating = () => {
    resetForm();
    setIsCreating(true);
    // Set template layout data
    const templateLayout: KeyboardLayout = {
      name: '',
      homeRow: ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';'],
      keys: [
        // Add template key mappings here
        { qwerty: 'a', target: 'a', finger: 0, row: 1 },
        { qwerty: 's', target: 's', finger: 1, row: 1 },
        // ... more keys
      ],
      learningOrder: [
        ['a', 's', 'd', 'f'],
        ['g', 'h', 'j', 'k'],
        ['l', ';']
      ]
    };
    setLayoutData(JSON.stringify(templateLayout, null, 2));
  };

  const startEditing = (layout: StoredLayout) => {
    setEditingLayout(layout);
    setIsCreating(false);
    setLayoutName(layout.name);
    setLayoutDescription(layout.description || '');
    setIsPublic(layout.is_public);
    setLayoutData(JSON.stringify(layout.layout_data, null, 2));
  };

  const handleSave = async () => {
    if (!layoutName.trim()) {
      toast({
        title: "Validation Error",
        description: "Layout name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const parsedLayoutData = JSON.parse(layoutData);
      // Update the name in the layout data
      parsedLayoutData.name = layoutName;
    } catch (error) {
      toast({
        title: "Invalid JSON",
        description: "Please check your layout data JSON format",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const layoutPayload = {
        name: layoutName,
        description: layoutDescription,
        layout_data: JSON.parse(layoutData),
        is_public: isPublic,
        created_by: user.user.id
      };

      if (editingLayout) {
        // Update existing layout
        const { error } = await supabase
          .from('keyboard_layouts')
          .update(layoutPayload)
          .eq('id', editingLayout.id);

        if (error) throw error;

        toast({
          title: "Layout updated",
          description: "Your keyboard layout has been updated successfully",
        });
      } else {
        // Create new layout
        const { error } = await supabase
          .from('keyboard_layouts')
          .insert(layoutPayload);

        if (error) throw error;

        toast({
          title: "Layout created",
          description: "Your keyboard layout has been created successfully",
        });
      }

      resetForm();
      fetchLayouts();
    } catch (error: any) {
      toast({
        title: "Error saving layout",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (layoutId: string) => {
    try {
      const { error } = await supabase
        .from('keyboard_layouts')
        .delete()
        .eq('id', layoutId);

      if (error) throw error;

      toast({
        title: "Layout deleted",
        description: "The keyboard layout has been deleted",
      });

      fetchLayouts();
    } catch (error: any) {
      toast({
        title: "Error deleting layout",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-muted rounded w-1/3"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </CardHeader>
          <CardContent>
            <div className="h-32 bg-muted rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Layout Builder</h2>
          <p className="text-muted-foreground">
            Create and manage custom keyboard layouts for your curriculums
          </p>
        </div>
        <Button onClick={startCreating}>
          <Plus className="w-4 h-4 mr-2" />
          Create Layout
        </Button>
      </div>

      {(isCreating || editingLayout) && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingLayout ? 'Edit Layout' : 'Create New Layout'}
            </CardTitle>
            <CardDescription>
              Define your custom keyboard layout with key mappings and learning progression
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="layout-name">Layout Name</Label>
                <Input
                  id="layout-name"
                  value={layoutName}
                  onChange={(e) => setLayoutName(e.target.value)}
                  placeholder="e.g., Dvorak, Workman, Custom Layout"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is-public"
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                />
                <Label htmlFor="is-public">Make public</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="layout-description">Description</Label>
              <Textarea
                id="layout-description"
                value={layoutDescription}
                onChange={(e) => setLayoutDescription(e.target.value)}
                placeholder="Describe your layout and its benefits..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="layout-data">Layout Data (JSON)</Label>
              <Textarea
                id="layout-data"
                value={layoutData}
                onChange={(e) => setLayoutData(e.target.value)}
                className="font-mono text-sm min-h-[300px]"
                placeholder="Enter your keyboard layout JSON data..."
              />
              <p className="text-xs text-muted-foreground">
                Define key mappings, home row, and learning progression. See existing layouts for reference.
              </p>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Layout'}
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {layouts.map((layout) => (
          <Card key={layout.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{layout.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {layout.description || 'No description provided'}
                  </CardDescription>
                </div>
                {layout.is_public && (
                  <Eye className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-xs text-muted-foreground">
                <div>Home Row: {layout.layout_data.homeRow?.join(', ')}</div>
                <div>Keys: {layout.layout_data.keys?.length || 0}</div>
                <div>Learning Stages: {layout.layout_data.learningOrder?.length || 0}</div>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => startEditing(layout)}
                  className="flex-1"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleDelete(layout.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {layouts.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Code className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No layouts found</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first custom keyboard layout to get started
            </p>
            <Button onClick={startCreating}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Layout
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LayoutBuilder;