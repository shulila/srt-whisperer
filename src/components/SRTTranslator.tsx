import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Upload, Download, Languages, FileText } from "lucide-react";
import { toast } from "sonner";

interface SRTEntry {
  index: number;
  startTime: string;
  endTime: string;
  text: string;
}

export function SRTTranslator() {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [translatedSRT, setTranslatedSRT] = useState<string>('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [originalEntries, setOriginalEntries] = useState<SRTEntry[]>([]);

  const parseSRT = (content: string): SRTEntry[] => {
    const entries: SRTEntry[] = [];
    const blocks = content.trim().split(/\n\s*\n/);

    blocks.forEach((block) => {
      const lines = block.split('\n');
      if (lines.length >= 3) {
        const index = parseInt(lines[0].trim());
        const timeMatch = lines[1].match(/(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/);
        
        if (timeMatch) {
          const [, startTime, endTime] = timeMatch;
          const text = lines.slice(2).join('\n').trim();
          
          entries.push({
            index,
            startTime,
            endTime,
            text
          });
        }
      }
    });

    return entries;
  };

  const translateText = async (text: string, targetLanguage: string): Promise<string> => {
    // Dummy translation for now - in real implementation, use OpenAI API
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (targetLanguage === 'hebrew') {
      return `תרגום: ${text}`;
    } else {
      return `Translation: ${text}`;
    }
  };

  const generateSRT = (entries: SRTEntry[]): string => {
    return entries
      .map((entry, index) => {
        return `${index + 1}\n${entry.startTime} --> ${entry.endTime}\n${entry.text}\n`;
      })
      .join('\n');
  };

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.toLowerCase().endsWith('.srt')) {
        toast.error('אנא בחר קובץ SRT תקין');
        return;
      }
      setFile(selectedFile);
      setTranslatedSRT('');
      toast.success('קובץ נטען בהצלחה!');
    }
  }, []);

  const handleTranslate = useCallback(async () => {
    if (!file || !selectedLanguage) {
      toast.error('אנא בחר קובץ ושפת תרגום');
      return;
    }

    setIsTranslating(true);

    try {
      const content = await file.text();
      const entries = parseSRT(content);
      setOriginalEntries(entries);

      const translatedEntries = await Promise.all(
        entries.map(async (entry) => ({
          ...entry,
          text: await translateText(entry.text, selectedLanguage)
        }))
      );

      const translatedContent = generateSRT(translatedEntries);
      setTranslatedSRT(translatedContent);
      
      toast.success('התרגום הושלם בהצלחה!');
    } catch (error) {
      toast.error('שגיאה בתרגום הקובץ');
      console.error('Translation error:', error);
    } finally {
      setIsTranslating(false);
    }
  }, [file, selectedLanguage]);

  const handleDownload = useCallback(() => {
    if (!translatedSRT) return;

    const blob = new Blob([translatedSRT], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `translated_${file?.name || 'subtitles.srt'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('הקובץ המתורגם הורד בהצלחה!');
  }, [translatedSRT, file]);

  return (
    <div className="min-h-screen bg-gradient-bg">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 bg-gradient-primary text-white px-6 py-3 rounded-full shadow-glow mb-6">
            <Languages className="w-6 h-6" />
            <span className="font-semibold text-lg">מתרגם כתוביות SRT</span>
          </div>
          <h1 className="text-4xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
            תרגום מקצועי לקבצי כתוביות
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            העלה קובץ SRT, בחר שפת יעד וקבל תרגום מדויק תוך שמירה על הטיימקודס המקוריים
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid gap-8 md:grid-cols-2">
          {/* Upload Section */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-primary" />
                העלאת קובץ
              </CardTitle>
              <CardDescription>
                בחר קובץ SRT לתרגום
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Language Selection */}
              <div className="space-y-2">
                <Label htmlFor="language">שפת התרגום</Label>
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר שפה" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hebrew">עברית</SelectItem>
                    <SelectItem value="english">אנגלית</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label htmlFor="file">קובץ SRT</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:bg-muted/50 transition-colors">
                  <input
                    id="file"
                    type="file"
                    accept=".srt"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <label htmlFor="file" className="cursor-pointer">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <div className="text-sm">
                      {file ? (
                        <span className="text-primary font-medium">{file.name}</span>
                      ) : (
                        <>
                          <span className="text-primary font-medium">לחץ לבחירת קובץ</span>
                          <span className="text-muted-foreground"> או גרור קובץ לכאן</span>
                        </>
                      )}
                    </div>
                  </label>
                </div>
              </div>

              <Button 
                onClick={handleTranslate}
                disabled={!file || !selectedLanguage || isTranslating}
                className="w-full bg-gradient-primary hover:opacity-90"
                size="lg"
              >
                {isTranslating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    מתרגם...
                  </>
                ) : (
                  <>
                    <Languages className="w-5 h-5 mr-2" />
                    תרגם כתוביות
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5 text-accent" />
                קובץ מתורגם
              </CardTitle>
              <CardDescription>
                הורד את הקובץ המתורגם
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {translatedSRT ? (
                <div className="space-y-4">
                  <div className="bg-muted rounded-lg p-4 max-h-64 overflow-y-auto">
                    <h4 className="font-medium mb-2 text-sm text-muted-foreground">תצוגה מקדימה:</h4>
                    <pre className="text-xs whitespace-pre-wrap font-mono">
                      {translatedSRT.substring(0, 500)}
                      {translatedSRT.length > 500 && '...'}
                    </pre>
                  </div>
                  
                  <Button 
                    onClick={handleDownload}
                    className="w-full bg-accent hover:opacity-90"
                    size="lg"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    הורד קובץ מתורגם
                  </Button>
                  
                  <div className="text-center text-sm text-muted-foreground">
                    {originalEntries.length} כתוביות תורגמו בהצלחה
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Languages className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    הקובץ המתורגם יופיע כאן לאחר התרגום
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Features */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold mb-8">תכונות המתרגם</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">שמירה על פורמט</h3>
              <p className="text-muted-foreground text-sm">
                טיימקודס ומבנה הקובץ נשמרים במדויק
              </p>
            </div>
            <div className="text-center">
              <div className="bg-accent/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Languages className="w-8 h-8 text-accent" />
              </div>
              <h3 className="font-semibold mb-2">תרגום מקצועי</h3>
              <p className="text-muted-foreground text-sm">
                תרגום איכותי לעברית ואנגלית
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Download className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">הורדה מיידית</h3>
              <p className="text-muted-foreground text-sm">
                קבל את הקובץ המתורגם תוך שניות
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}