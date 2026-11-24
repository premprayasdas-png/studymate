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

import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

// Firebase configuration
import { auth, db } from "./firebaseconfig";

interface Note {
  id: string;
  title: string;
  content: string;
}

export default function NotesScreen() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(auth.currentUser);

  useEffect(() => {
    return onAuthStateChanged(auth, (currentUser) => {
      setLoading(true);
      setNotes([]);
      setUser(currentUser);
      if (!currentUser) {
        setLoading(false);
      }
    });
  }, []);

  // Load notes from Firebase
  useEffect(() => {
    if (!user) {
      return;
    }

    const notesQuery = query(
      collection(db, "users", user.uid, "notes"),
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(
      notesQuery,
      (snapshot) => {
        const savedNotes: Note[] = snapshot.docs.map((item) => ({
          id: item.id,
          title: item.data().title,
          content: item.data().content,
        }));

        setNotes(savedNotes);
        setLoading(false);
      },
      (error) => {
        Alert.alert("Error", error.message);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [user]);

  // Save or update note
  const saveNote = async () => {
    if (!user) {
      Alert.alert("Login required", "Please login first.");
      return;
    }

    if (!title.trim() || !content.trim()) {
      Alert.alert("Missing details", "Please enter both title and content.");
      return;
    }

    try {
      setSaving(true);

      if (editingId) {
        await updateDoc(doc(db, "users", user.uid, "notes", editingId), {
          title: title.trim(),
          content: content.trim(),
          updatedAt: serverTimestamp(),
        });

        Alert.alert("Success", "Note updated!");
      } else {
        await addDoc(collection(db, "users", user.uid, "notes"), {
          title: title.trim(),
          content: content.trim(),
          createdAt: serverTimestamp(),
        });

        Alert.alert("Success", "Note saved!");
      }

      setTitle("");
      setContent("");
      setEditingId(null);
    } catch (error: any) {
      Alert.alert("Save failed", error.message);
    } finally {
      setSaving(false);
    }
  };

  // Edit note
  const editNote = (note: Note) => {
    setEditingId(note.id);
    setTitle(note.title);
    setContent(note.content);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingId(null);
    setTitle("");
    setContent("");
  };

  // Delete note
  const removeNote = (id: string) => {
    if (!user) return;

    Alert.alert("Delete Note", "Are you sure you want to delete this note?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDoc(doc(db, "users", user.uid, "notes", id));

            if (editingId === id) {
              cancelEditing();
            }

            Alert.alert("Success", "Note deleted!");
          } catch (error: any) {
            Alert.alert("Delete failed", error.message);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>My Notes 📝</Text>
        <Text style={styles.subtitle}>Save your important study notes</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Enter note title"
          value={title}
          onChangeText={setTitle}
        />

        <TextInput
          style={styles.contentInput}
          placeholder="Write your study notes here..."
          value={content}
          onChangeText={setContent}
          multiline
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={styles.saveButton}
          onPress={saveNote}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>
              {editingId ? "Update Note" : "Save Note"}
            </Text>
          )}
        </TouchableOpacity>

        {editingId && (
          <TouchableOpacity onPress={cancelEditing}>
            <Text style={styles.cancelText}>Cancel Editing</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.listHeading}>Saved Notes</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#4F46E5" />
      ) : (
        <FlatList
          data={notes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No notes yet. Add your first note!
            </Text>
          }
          renderItem={({ item }) => (
            <View style={styles.noteCard}>
              <Text style={styles.noteTitle}>{item.title}</Text>

              <Text style={styles.noteContent}>{item.content}</Text>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => editNote(item)}
                >
                  <Text style={styles.buttonText}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => removeNote(item.id)}
                >
                  <Text style={styles.buttonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FF",
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

  form: {
    paddingHorizontal: 20,
  },

  input: {
    backgroundColor: "#FFFFFF",
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  contentInput: {
    backgroundColor: "#FFFFFF",
    padding: 15,
    borderRadius: 12,
    height: 120,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  saveButton: {
    backgroundColor: "#4F46E5",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },

  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },

  cancelText: {
    color: "#4F46E5",
    textAlign: "center",
    margin: 12,
  },

  listHeading: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#172554",
    margin: 20,
  },

  list: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },

  emptyText: {
    textAlign: "center",
    color: "#64748B",
    marginTop: 20,
  },

  noteCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 14,
    marginBottom: 14,
    elevation: 2,
  },

  noteTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#172554",
    marginBottom: 8,
  },

  noteContent: {
    color: "#475569",
    lineHeight: 22,
  },

  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 15,
  },

  editButton: {
    flex: 1,
    backgroundColor: "#4F46E5",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },

  deleteButton: {
    flex: 1,
    backgroundColor: "#EF4444",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
});
