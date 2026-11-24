import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from "react-native";
import { onAuthStateChanged } from "firebase/auth";
import {
  addDoc, collection, onSnapshot, orderBy, query, serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "./firebaseconfig";

type ToolTab = "planner" | "timetable" | "subjects" | "quiz" | "tutor" | "progress";
type Entry = { id: string; [key: string]: any };

const AI_LANGUAGES = [
  "Auto (same as question)", "English", "Odia (ଓଡ଼ିଆ)", "Hindi (हिन्दी)",
  "Bengali (বাংলা)", "Telugu (తెలుగు)", "Tamil (தமிழ்)", "Marathi (मराठी)",
  "Urdu (اردو)", "Gujarati (ગુજરાતી)", "Kannada (ಕನ್ನಡ)", "Malayalam (മലയാളം)",
  "Punjabi (ਪੰਜਾਬੀ)", "Nepali (नेपाली)", "Spanish", "French", "Arabic",
  "Portuguese", "German", "Japanese", "Korean", "Chinese",
];

const tabs: { id: ToolTab; label: string; icon: string }[] = [
  { id: "planner", label: "Planner", icon: "📅" },
  { id: "timetable", label: "Timetable", icon: "⏰" },
  { id: "subjects", label: "Subjects", icon: "📚" },
  { id: "quiz", label: "Quiz", icon: "🎯" },
  { id: "tutor", label: "AI Tutor", icon: "🤖" },
  { id: "progress", label: "Progress", icon: "📈" },
];

export default function StudyToolsScreen() {
  const [tab, setTab] = useState<ToolTab>("planner");
  const [uid, setUid] = useState<string | null>(auth.currentUser?.uid ?? null);
  const [items, setItems] = useState<Entry[]>([]);
  const [sessions, setSessions] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [tutorReply, setTutorReply] = useState("");
  const [aiLanguage, setAiLanguage] = useState("Auto (same as question)");
  const [askingTutor, setAskingTutor] = useState(false);

  useEffect(() => onAuthStateChanged(auth, user => setUid(user?.uid ?? null)), []);

  useEffect(() => {
    if (!uid) {
      setItems([]);
      setSessions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const path = tab === "planner" ? "planner" : tab === "timetable" ? "timetable" : "subjects";
    if (tab === "progress") {
      const q = query(collection(db, "users", uid, "studySessions"), orderBy("date", "desc"));
      return onSnapshot(q, snap => {
        setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      }, err => { Alert.alert("Could not load progress", err.message); setLoading(false); });
    }
    if (tab === "planner" || tab === "timetable" || tab === "subjects") {
      const q = query(collection(db, "users", uid, path), orderBy("createdAt", "desc"));
      return onSnapshot(q, snap => {
        setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      }, err => { Alert.alert("Could not load items", err.message); setLoading(false); });
    }
    setLoading(false);
  }, [uid, tab]);

  const totalHours = useMemo(() => sessions.reduce((sum, s) => sum + (Number(s.hours) || 0), 0), [sessions]);
  const today = new Date().toISOString().slice(0, 10);
  const todayHours = sessions.filter(s => s.date === today).reduce((sum, s) => sum + (Number(s.hours) || 0), 0);

  const saveEntry = async () => {
    if (!uid) return Alert.alert("Login required", "Please log in to save your study data.");
    if (!title.trim()) return Alert.alert("Missing title", "Enter a name first.");
    const path = tab === "planner" ? "planner" : tab === "timetable" ? "timetable" : "subjects";
    try {
      await addDoc(collection(db, "users", uid, path), {
        title: title.trim(), detail: detail.trim(), date: tab === "planner" ? date : "",
        createdAt: serverTimestamp(),
      });
      setTitle(""); setDetail("");
      Alert.alert("Saved", "Your item has been saved to your account.");
    } catch (e: any) { Alert.alert("Save failed", e.message); }
  };

  const askTutor = async () => {
    const prompt = question.trim();
    if (!prompt) return Alert.alert("Enter a question", "Type your question first.");
    const endpoint = process.env.EXPO_PUBLIC_STUDYMATE_AI_URL?.trim();
    if (!endpoint) {
      return Alert.alert(
        "AI service not connected",
        "Set EXPO_PUBLIC_STUDYMATE_AI_URL in your project .env file to your deployed StudyMate Worker URL, then restart Expo."
      );
    }
    try {
      setAskingTutor(true);
      setTutorReply("");
      const response = await fetch(`${endpoint.replace(/\\/$/, "")}/api/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: prompt, language: aiLanguage }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "AI request failed. Please try again.");
      setTutorReply(data.answer || "The AI did not return an answer. Please try again.");
    } catch (error: any) {
      Alert.alert("StudyMate AI", error?.message || "Could not connect to the AI service.");
    } finally {
      setAskingTutor(false);
    }
  };

  const renderEntryForm = (placeholder: string, detailPlaceholder: string) => (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>Add {tab === "planner" ? "a task" : tab === "timetable" ? "a class" : "a subject"}</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder={placeholder} />
      <TextInput style={styles.input} value={detail} onChangeText={setDetail} placeholder={detailPlaceholder} />
      {tab === "planner" && <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="Date (YYYY-MM-DD)" />}
      <TouchableOpacity style={styles.primaryButton} onPress={saveEntry}><Text style={styles.primaryText}>Save</Text></TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Your Study Space</Text>
      <Text style={styles.subheading}>Plan, practise and track your learning.</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
        {tabs.map(t => <TouchableOpacity key={t.id} onPress={() => { setTab(t.id); setTitle(""); setDetail(""); }} style={[styles.tab, tab === t.id && styles.activeTab]}>
          <Text style={styles.tabText}>{t.icon} {t.label}</Text>
        </TouchableOpacity>)}
      </ScrollView>

      {!uid && <View style={styles.panel}><Text style={styles.body}>Log in to save and sync your study data.</Text></View>}

      {tab === "planner" && <>{renderEntryForm("Task or goal", "Notes / priority")}
        <Text style={styles.panelTitle}>Your tasks</Text>
        {loading ? <ActivityIndicator color="#4F46E5" /> : items.map(i => <View key={i.id} style={styles.listCard}><Text style={styles.itemTitle}>{i.title}</Text><Text style={styles.body}>{i.detail || "No extra details"} · {i.date || "No date"}</Text></View>)}
        {!loading && items.length === 0 && <Text style={styles.body}>No tasks yet. Add your first study goal.</Text>}
      </>}

      {tab === "timetable" && <>{renderEntryForm("Class / activity", "Day and time (e.g. Monday, 10:00 AM)")}
        <Text style={styles.panelTitle}>Your timetable</Text>
        {loading ? <ActivityIndicator color="#4F46E5" /> : items.map(i => <View key={i.id} style={styles.listCard}><Text style={styles.itemTitle}>{i.title}</Text><Text style={styles.body}>{i.detail || "Time not added"}</Text></View>)}
        {!loading && items.length === 0 && <Text style={styles.body}>Add your classes to build your timetable.</Text>}
      </>}

      {tab === "subjects" && <>{renderEntryForm("Subject name", "Course code / semester / topics")}
        <Text style={styles.panelTitle}>Your subjects</Text>
        {loading ? <ActivityIndicator color="#4F46E5" /> : items.map(i => <View key={i.id} style={styles.listCard}><Text style={styles.itemTitle}>📘 {i.title}</Text><Text style={styles.body}>{i.detail}</Text></View>)}
        {!loading && items.length === 0 && <Text style={styles.body}>Add the subjects you are studying.</Text>}
      </>}

      {tab === "quiz" && <View style={styles.panel}>
        <Text style={styles.panelTitle}>Quick practice quiz</Text>
        <Text style={styles.body}>Try this sample question from C programming.</Text>
        <Text style={styles.question}>Which C loop checks its condition before executing the loop body?</Text>
        {["do-while", "while", "Both always execute once", "None"].map((a, n) => <TouchableOpacity key={a} style={[styles.answer, answer === a && styles.selectedAnswer]} onPress={() => setAnswer(a)}><Text style={styles.body}>{String.fromCharCode(65+n)}. {a}</Text></TouchableOpacity>)}
        <TouchableOpacity style={styles.primaryButton} onPress={() => Alert.alert(answer === "while" ? "Correct!" : "Not quite", "The while loop checks its condition before each iteration.")} disabled={!answer}><Text style={styles.primaryText}>Check answer</Text></TouchableOpacity>
        <Text style={styles.note}>This is a starter practice quiz. AI-generated quizzes will be enabled when the secure AI service is connected.</Text>
      </View>}

      {tab === "tutor" && <View style={styles.panel}>
        <Text style={styles.panelTitle}>StudyMate AI Tutor 🤖</Text>
        <Text style={styles.note}>Ask academic or general questions in your own language. Auto mode replies in the language you use.</Text>
        <Text style={styles.label}>Answer language</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.languageRow}>
          {AI_LANGUAGES.map(language => <TouchableOpacity key={language} onPress={() => setAiLanguage(language)} style={[styles.languageChip, aiLanguage === language && styles.languageChipActive]}>
            <Text style={[styles.languageText, aiLanguage === language && styles.languageTextActive]}>{language}</Text>
          </TouchableOpacity>)}
        </ScrollView>
        <TextInput style={[styles.input, styles.multiline]} multiline value={question} onChangeText={setQuestion} placeholder="Ask anything: maths, science, coding, English, Odia, Hindi..." />
        <TouchableOpacity style={[styles.primaryButton, askingTutor && styles.disabledButton]} onPress={askTutor} disabled={askingTutor}>
          {askingTutor ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryText}>Ask StudyMate AI</Text>}
        </TouchableOpacity>
        {!!tutorReply && <View style={styles.reply}><Text selectable style={styles.body}>{tutorReply}</Text></View>}
      </View>}

      {tab === "progress" && <View style={styles.panel}>
        <Text style={styles.panelTitle}>Your learning progress</Text>
        {loading ? <ActivityIndicator color="#4F46E5" /> : <>
          <View style={styles.statsRow}><View style={styles.stat}><Text style={styles.statValue}>{totalHours.toFixed(1)}h</Text><Text style={styles.body}>Total tracked</Text></View><View style={styles.stat}><Text style={styles.statValue}>{todayHours.toFixed(1)}h</Text><Text style={styles.body}>Today</Text></View><View style={styles.stat}><Text style={styles.statValue}>{sessions.length}</Text><Text style={styles.body}>Sessions</Text></View></View>
          <Text style={styles.note}>Log study sessions in the Study Tracker to see your progress here.</Text>
        </>}
      </View>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F5F7FF" },
  content: { padding: 20, paddingBottom: 48, maxWidth: 900, width: "100%", alignSelf: "center" },
  heading: { fontSize: 28, fontWeight: "800", color: "#172554", marginTop: 18 },
  subheading: { color: "#64748B", marginTop: 6, marginBottom: 18 },
  tabRow: { gap: 8, paddingBottom: 18 },
  tab: { backgroundColor: "#E8ECF8", borderRadius: 20, paddingVertical: 11, paddingHorizontal: 14 },
  activeTab: { backgroundColor: "#4F46E5" },
  tabText: { color: "#172554", fontWeight: "700" },
  panel: { backgroundColor: "#FFFFFF", padding: 18, borderRadius: 16, marginBottom: 18, borderWidth: 1, borderColor: "#E2E8F0" },
  panelTitle: { color: "#172554", fontSize: 19, fontWeight: "800", marginBottom: 12, marginTop: 8 },
  input: { backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 10, padding: 13, marginBottom: 10, color: "#172554" },
  multiline: { minHeight: 90, textAlignVertical: "top" },
  primaryButton: { backgroundColor: "#4F46E5", borderRadius: 10, padding: 14, alignItems: "center", marginTop: 4 },
  primaryText: { color: "#FFFFFF", fontWeight: "800" },
  listCard: { padding: 14, borderRadius: 12, backgroundColor: "#F8FAFC", marginBottom: 9 },
  itemTitle: { color: "#172554", fontWeight: "800", fontSize: 16 },
  body: { color: "#475569", lineHeight: 21, marginTop: 5 },
  question: { color: "#172554", fontWeight: "700", fontSize: 16, marginVertical: 14, lineHeight: 23 },
  answer: { padding: 12, borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 10, marginBottom: 8 },
  selectedAnswer: { borderColor: "#4F46E5", backgroundColor: "#EEF2FF" },
  note: { color: "#64748B", fontSize: 12, lineHeight: 18, marginTop: 12 },
  label: { color: "#172554", fontWeight: "700", marginTop: 14, marginBottom: 8 },
  languageRow: { gap: 8, paddingBottom: 12 },
  languageChip: { borderWidth: 1, borderColor: "#CBD5E1", borderRadius: 18, paddingHorizontal: 12, paddingVertical: 9, backgroundColor: "#F8FAFC" },
  languageChipActive: { backgroundColor: "#4F46E5", borderColor: "#4F46E5" },
  languageText: { color: "#334155", fontSize: 12, fontWeight: "600" },
  languageTextActive: { color: "#FFFFFF" },
  disabledButton: { opacity: 0.65 },
  reply: { backgroundColor: "#EEF2FF", borderRadius: 12, padding: 14, marginTop: 14 },
  statsRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  stat: { flex: 1, backgroundColor: "#EEF2FF", padding: 12, borderRadius: 12 },
  statValue: { color: "#4F46E5", fontSize: 22, fontWeight: "800" },
});
