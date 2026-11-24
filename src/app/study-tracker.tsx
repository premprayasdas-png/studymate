import { useEffect, useState } from "react";

import {
    ActivityIndicator,
    Alert,
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { onAuthStateChanged } from "firebase/auth";

import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "./firebaseconfig";

interface StudySession {
  id: string;
  subject: string;
  hours: number;
  date: string;
}

const getToday = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export default function StudyTracker() {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [subject, setSubject] = useState("");
  const [hours, setHours] = useState("");
  const [date, setDate] = useState(getToday());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Firebase Authentication
  useEffect(() => {
    let unsubscribeSessions: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      unsubscribeSessions?.();
      unsubscribeSessions = undefined;

      setSessions([]);

      if (!currentUser) {
        setUserId(null);
        setLoading(false);
        return;
      }

      setUserId(currentUser.uid);
      setLoading(true);

      const sessionsQuery = query(
        collection(db, "users", currentUser.uid, "studySessions"),
        orderBy("date", "desc"),
      );

      unsubscribeSessions = onSnapshot(
        sessionsQuery,
        (snapshot) => {
          const data: StudySession[] = snapshot.docs.map((item) => {
            const session = item.data();

            return {
              id: item.id,
              subject: session.subject,
              hours: session.hours,
              date: session.date,
            };
          });

          setSessions(data);
          setLoading(false);
        },
        (error) => {
          Alert.alert("Firebase Error", error.message);
          setLoading(false);
        },
      );
    });

    return () => {
      unsubscribeSessions?.();
      unsubscribeAuth();
    };
  }, []);

  // Save Study Session
  const saveSession = async () => {
    if (!userId) {
      Alert.alert("Login Required", "Please login first.");
      return;
    }

    const studyHours = Number(hours);

    if (!subject.trim() || !hours.trim() || !date.trim()) {
      Alert.alert("Missing Details", "Please fill all fields.");
      return;
    }

    if (!Number.isFinite(studyHours) || studyHours <= 0 || studyHours > 24) {
      Alert.alert("Invalid Hours", "Enter a number between 0 and 24.");
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      Alert.alert("Invalid Date", "Use YYYY-MM-DD format.");
      return;
    }

    const parsedDate = new Date(`${date}T00:00:00`);

    if (
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate.toISOString().slice(0, 10) !== date
    ) {
      Alert.alert("Invalid Date", "Please enter a valid date.");
      return;
    }

    try {
      setSaving(true);

      await addDoc(collection(db, "users", userId, "studySessions"), {
        subject: subject.trim(),
        hours: studyHours,
        date,
        createdAt: serverTimestamp(),
      });

      setSubject("");
      setHours("");
      setDate(getToday());

      Alert.alert("Success", "Study session saved!");
    } catch (error: any) {
      Alert.alert("Save Failed", error.message);
    } finally {
      setSaving(false);
    }
  };

  // Delete Study Session
  const removeSession = (id: string) => {
    if (!userId) return;

    Alert.alert("Delete Session", "Do you want to delete this study session?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDoc(doc(db, "users", userId, "studySessions", id));

            Alert.alert("Success", "Session deleted.");
          } catch (error: any) {
            Alert.alert("Delete Failed", error.message);
          }
        },
      },
    ]);
  };

  // Daily Study Hours
  const today = getToday();

  const dailyHours = sessions
    .filter((item) => item.date === today)
    .reduce((total, item) => total + item.hours, 0);

  // Weekly Study Hours
  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - 6);

  const weeklySessions = sessions.filter((item) => {
    const sessionDate = new Date(`${item.date}T00:00:00`);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    return sessionDate >= weekStart && sessionDate <= endOfToday;
  });

  const weeklyHours = weeklySessions.reduce(
    (total, item) => total + item.hours,
    0,
  );

  // User Interface
  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <Text style={styles.heading}>Study Tracker 📚</Text>
              <Text style={styles.subtitle}>
                Track your daily and weekly progress
              </Text>
            </View>

            {/* Statistics */}
            <View style={styles.stats}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{dailyHours.toFixed(1)} h</Text>
                <Text style={styles.statLabel}>Today&apos;s Study</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statNumber}>
                  {weeklyHours.toFixed(1)} h
                </Text>
                <Text style={styles.statLabel}>Last 7 Days</Text>
              </View>
            </View>

            {/* Add Study Session */}
            <View style={styles.form}>
              <Text style={styles.formHeading}>Add Study Session</Text>

              <TextInput
                style={styles.input}
                placeholder="Enter subject (e.g. Mathematics)"
                value={subject}
                onChangeText={setSubject}
              />

              <TextInput
                style={styles.input}
                placeholder="Study hours (e.g. 2.5)"
                value={hours}
                onChangeText={setHours}
                keyboardType="decimal-pad"
              />

              <TextInput
                style={styles.input}
                placeholder="Date (YYYY-MM-DD)"
                value={date}
                onChangeText={setDate}
              />

              <TouchableOpacity
                style={styles.saveButton}
                onPress={saveSession}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>Save Study Session</Text>
                )}
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionHeading}>Study History</Text>

            {loading && <ActivityIndicator size="large" color="#4F46E5" />}
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.sessionCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sessionSubject}>{item.subject}</Text>
              <Text style={styles.sessionDate}>{item.date}</Text>
              <Text style={styles.sessionHours}>{item.hours} hours</Text>
            </View>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => removeSession(item.id)}
            >
              <Text style={styles.buttonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          loading ? undefined : (
            <Text style={styles.emptyText}>
              No study sessions yet. Add your first session!
            </Text>
          )
        }
      />
    </SafeAreaView>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FF",
  },

  list: {
    paddingBottom: 30,
  },

  header: {
    padding: 22,
  },

  heading: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#172554",
  },

  subtitle: {
    color: "#64748B",
    marginTop: 5,
  },

  stats: {
    flexDirection: "row",
    paddingHorizontal: 15,
    gap: 12,
  },

  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 14,
    alignItems: "center",
    elevation: 2,
  },

  statNumber: {
    fontSize: 25,
    fontWeight: "bold",
    color: "#4F46E5",
  },

  statLabel: {
    color: "#64748B",
    marginTop: 6,
  },

  form: {
    backgroundColor: "#FFFFFF",
    margin: 18,
    padding: 18,
    borderRadius: 14,
    elevation: 2,
  },

  formHeading: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#172554",
    marginBottom: 15,
  },

  input: {
    backgroundColor: "#F8FAFC",
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  saveButton: {
    backgroundColor: "#4F46E5",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 5,
  },

  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },

  sectionHeading: {
    fontSize: 21,
    fontWeight: "bold",
    color: "#172554",
    marginHorizontal: 20,
    marginBottom: 12,
  },

  sessionCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 18,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
  },

  sessionSubject: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#172554",
  },

  sessionDate: {
    color: "#64748B",
    marginTop: 5,
  },

  sessionHours: {
    color: "#4F46E5",
    fontWeight: "bold",
    marginTop: 5,
  },

  deleteButton: {
    backgroundColor: "#EF4444",
    padding: 10,
    borderRadius: 8,
  },

  emptyText: {
    textAlign: "center",
    color: "#64748B",
    margin: 20,
  },
});
