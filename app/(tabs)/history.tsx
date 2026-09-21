import { useState, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { COLORS } from '@/constants/colors';
import { useAuth } from '@/lib/auth';
import { getTeacherEventAttendance, type TeacherEventAttendance } from '@/lib/attendance';
import { getProfile, type Role } from '@/lib/profiles';
import { getAttendanceHistory, type AttendanceRecord } from '@/lib/attendance';

function shortId(id: string) {
  return id ? `…${id.slice(-8)}` : 'unknown';
}

export default function HistoryScreen() {
  const { user } = useAuth();
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [studentRecords, setStudentRecords] = useState<AttendanceRecord[]>([]);
  const [teacherEvents, setTeacherEvents] = useState<TeacherEventAttendance[]>([]);

  const loadData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);

    const profile = await getProfile(user.id);
    const currentRole = profile?.role ?? 'student';
    setRole(currentRole);

    if (currentRole === 'teacher') {
      const events = await getTeacherEventAttendance(user.id);
      setTeacherEvents(events);
      setStudentRecords([]);
    } else {
      const records = await getAttendanceHistory(user.id);
      setStudentRecords(records);
      setTeacherEvents([]);
    }

    setLoading(false);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Attendance History</Text>
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
      </View>
    );
  }

  if (role === 'teacher') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Event Attendance Overview</Text>
        <FlatList
          data={teacherEvents}
          keyExtractor={(item) => item.eventId}
          ListEmptyComponent={
            <Text style={styles.subtitle}>No events created yet.</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.attendeeCount} scanned</Text>
                </View>
              </View>
              <Text style={styles.cardDate}>Code: {item.eventCode}</Text>

              {item.attendees.length > 0 && (
                <View style={styles.attendeeSection}>
                  <Text style={styles.attendeeHeader}>Attendees:</Text>
                  {item.attendees.map((att, idx) => (
                    <View key={idx} style={styles.attendeeRow}>
                      <Text style={styles.attendeeId}>{shortId(att.studentId)}</Text>
                      <Text style={styles.attendeeTime}>
                        {new Date(att.scannedAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Attendance History</Text>
      <FlatList
        data={studentRecords}
        keyExtractor={(item) => String(item.id)}
        ListEmptyComponent={
          <Text style={styles.subtitle}>
            No records yet. Scan a QR code to register your attendance.
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.eventTitle}</Text>
            <Text style={styles.cardDate}>Code: {item.eventId}</Text>
            <Text style={styles.cardDate}>
              Scanned on: {new Date(item.scannedAt).toLocaleString()}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
  },
  cardDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  badge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  attendeeSection: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  attendeeHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  attendeeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  attendeeId: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: COLORS.textSecondary,
  },
  attendeeTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});