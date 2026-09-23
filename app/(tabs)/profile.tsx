import { useCallback, useState } from 'react';
import { StyleSheet, Text, View, Alert, TextInput, Pressable, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';

import AppButton from '@/components/AppButton';
import { COLORS } from '@/constants/colors';
import { useAuth, signOut } from '@/lib/auth';
import { getProfile, updateProfile, type Profile } from '@/lib/profiles';

export default function ProfileScreen() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const loadProfile = useCallback(async () => {
    if (!user) return;
    const p = await getProfile(user.id);
    setProfile(p);
    setDraftName(p?.full_name ?? '');
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const handleSaveName = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await updateProfile(user.id, {
      full_name: draftName.trim(),
    });
    setSaving(false);

    if (error) {
      Alert.alert('Error', error);
    } else {
      setProfile((prev) =>
        prev ? { ...prev, full_name: draftName.trim() } : prev
      );
      setEditing(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to sign out.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>My Profile</Text>
        {profile?.role === 'teacher' ? (
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>Teacher</Text>
          </View>
        ) : (
          <View style={[styles.roleBadge, styles.roleBadgeStudent]}>
            <Text style={styles.roleBadgeText}>Student</Text>
          </View>
        )}
      </View>

      {user && (
        <View style={styles.infoCard}>
          <Text style={styles.label}>Full Name</Text>
          {editing ? (
            <View style={styles.nameEditRow}>
              <TextInput
                value={draftName}
                onChangeText={setDraftName}
                style={styles.editInput}
                placeholder="Enter full name"
                placeholderTextColor={COLORS.textSecondary}
              />
              <Pressable
                style={styles.saveBtn}
                onPress={handleSaveName}
                disabled={saving}
              >
                <Text style={styles.saveBtnText}>
                  {saving ? 'Saving...' : 'Save'}
                </Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={() => setEditing(true)}
              style={styles.nameRow}
            >
              <Text style={styles.value}>
                {profile?.full_name || 'Tap to add your name'}
              </Text>
              <Text style={styles.editHint}>Edit</Text>
            </Pressable>
          )}

          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user.email}</Text>

          <Text style={styles.label}>User ID</Text>
          <Text style={styles.valueSmall}>{user.id}</Text>
        </View>
      )}

     <AppButton
        title="Sign Out"
        icon="log-out-outline"
        onPress={handleSignOut}
        disabled={false}
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  roleBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleBadgeStudent: {
    backgroundColor: COLORS.textSecondary,
  },
  roleBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  infoCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 4,
    marginTop: 8,
  },
  value: {
    fontSize: 15,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  valueSmall: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  editHint: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  nameEditRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  editInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    borderRadius: 8,
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});