import { useRouter } from "expo-router";
import { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";

import { auth } from "./firebaseconfig";

const features = [
  { icon: "📝", title: "My Notes", subtitle: "Save your study notes" },
  { icon: "📅", title: "Study Planner", subtitle: "Plan your daily study" },
  { icon: "⏰", title: "Timetable", subtitle: "Manage your classes" },
  { icon: "📚", title: "Subjects", subtitle: "Organize your subjects" },
  { icon: "🎯", title: "Exam Preparation", subtitle: "Prepare for exams" },
  { icon: "📊", title: "Progress", subtitle: "Track your learning" },
];

export default function HomeScreen() {
  const router = useRouter();

  const [signup, setSignup] = useState(false);
  const [user, setUser] = useState(auth.currentUser);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);

  // Firebase authentication listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthChecking(false);
    });

    return unsubscribe;
  }, []);

  // Signup
  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert("Missing details", "Please fill all fields.");
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        "Password error",
        "Password must have at least 6 characters.",
      );
      return;
    }

    try {
      setLoading(true);

      const result = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password,
      );

      await updateProfile(result.user, {
        displayName: name.trim(),
      });

      setUser(result.user);

      Alert.alert("Welcome!", "Your PremVerse account is ready.");
    } catch (error: any) {
      Alert.alert("Signup failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  // Login
  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Missing details", "Enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const result = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password,
      );

      setUser(result.user);

      Alert.alert("Success", "Welcome back to PremVerse!");
    } catch (error: any) {
      Alert.alert("Login failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);

      setEmail("");
      setPassword("");
      setName("");
      setSignup(false);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  // Navigate to features
  const openFeature = (title: string) => {
    if (title === "My Notes") {
      router.push("/notes");
      return;
    }

    Alert.alert(title, "We will build this feature next!");
  };

  // Authentication loading
  if (authChecking) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </SafeAreaView>
    );
  }

  // Dashboard
  if (user) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView>
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>HELLO, STUDENT 👋</Text>

              <Text style={styles.title}>PremVerse</Text>

              <Text style={styles.subtitle}>
                Welcome, {user.displayName || "Student"}!
              </Text>
            </View>

            <Text style={styles.avatar}>🎓</Text>
          </View>

          <View style={styles.banner}>
            <Text style={styles.bannerTitle}>Study smarter,</Text>

            <Text style={styles.bannerTitle}>achieve more!</Text>

            <Text style={styles.bannerText}>
              Organize your learning journey in one place.
            </Text>

            <Text style={styles.bannerEmoji}>🚀</Text>
          </View>

          <Text style={styles.sectionTitle}>Your Study Space</Text>

          <View style={styles.grid}>
            {features.map((item) => (
              <TouchableOpacity
                key={item.title}
                style={styles.card}
                activeOpacity={0.7}
                onPress={() => openFeature(item.title)}
              >
                <Text style={styles.icon}>{item.icon}</Text>

                <Text style={styles.cardTitle}>{item.title}</Text>

                <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.buttonText}>Logout</Text>
          </TouchableOpacity>

          <Text style={styles.footer}>Made with ❤️ for students</Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Login and Signup screen
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.authContainer}>
        <Text style={styles.logo}>🎓</Text>

        <Text style={styles.title}>PremVerse</Text>

        <Text style={styles.subtitle}>Learn • Grow • Achieve</Text>

        <Text style={styles.sectionTitle}>
          {signup ? "Create Account" : "Welcome Back!"}
        </Text>

        {signup && (
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            value={name}
            onChangeText={setName}
          />
        )}

        <TextInput
          style={styles.input}
          placeholder="Email Address"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          placeholder="Password (minimum 6 characters)"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          style={styles.button}
          disabled={loading}
          onPress={signup ? handleSignup : handleLogin}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>
              {signup ? "Sign Up" : "Login"}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setSignup(!signup)} disabled={loading}>
          <Text style={styles.switchText}>
            {signup
              ? "Already have an account? Login"
              : "New student? Create an account"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FF",
    justifyContent: "center",
  },

  authContainer: {
    flex: 1,
    justifyContent: "center",
    padding: 25,
  },

  logo: {
    fontSize: 55,
    textAlign: "center",
  },

  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#172554",
    marginTop: 8,
  },

  subtitle: {
    color: "#64748B",
    marginTop: 6,
  },

  greeting: {
    color: "#64748B",
    fontWeight: "bold",
  },

  avatar: {
    fontSize: 40,
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#172554",
    marginTop: 30,
    marginBottom: 18,
  },

  input: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  button: {
    backgroundColor: "#4F46E5",
    padding: 17,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },

  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
    textAlign: "center",
  },

  switchText: {
    color: "#4F46E5",
    textAlign: "center",
    marginTop: 22,
    fontWeight: "bold",
  },

  header: {
    padding: 22,
    paddingTop: 35,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  banner: {
    backgroundColor: "#4F46E5",
    margin: 20,
    padding: 22,
    borderRadius: 20,
  },

  bannerTitle: {
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "bold",
  },

  bannerText: {
    color: "#E0E7FF",
    marginTop: 10,
  },

  bannerEmoji: {
    fontSize: 35,
    textAlign: "right",
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
  },

  card: {
    width: "45%",
    flexGrow: 1,
    backgroundColor: "#FFFFFF",
    margin: "2%",
    padding: 17,
    borderRadius: 16,
    minHeight: 130,
    justifyContent: "center",
    elevation: 2,
  },

  icon: {
    fontSize: 29,
    marginBottom: 10,
  },

  cardTitle: {
    fontWeight: "bold",
    color: "#172554",
  },

  cardSubtitle: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 5,
  },

  logoutButton: {
    backgroundColor: "#EF4444",
    margin: 20,
    padding: 15,
    borderRadius: 12,
  },

  footer: {
    textAlign: "center",
    color: "#94A3B8",
    margin: 20,
  },
});
