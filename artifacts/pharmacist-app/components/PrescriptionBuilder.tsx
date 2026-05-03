import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Modal,
  FlatList,
  ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import {
  MEDICATIONS,
  searchMedications,
  type MedicationEntry,
  type PrescriptionItemDraft,
} from "@/data/medications";

export function emptyPrescriptionItem(): PrescriptionItemDraft {
  return { name: "", strength: "", form: "", quantity: "", sig: "", duration: "" };
}

interface PrescriptionBuilderProps {
  items: PrescriptionItemDraft[];
  onChange: (next: PrescriptionItemDraft[]) => void;
}

export default function PrescriptionBuilder({ items, onChange }: PrescriptionBuilderProps) {
  const colors = useColors();
  const update = (idx: number, patch: Partial<PrescriptionItemDraft>) =>
    onChange(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  const remove = (idx: number) => onChange(items.filter((_, i) => i !== idx));
  const add = () => onChange([...items, emptyPrescriptionItem()]);

  return (
    <View style={{ gap: 12 }}>
      {items.length === 0 && (
        <View style={{ padding: 16, borderWidth: 1, borderStyle: "dashed", borderColor: colors.border, borderRadius: 12 }}>
          <Text style={{ fontSize: 13, color: colors.mutedForeground, textAlign: "center" }}>
            No medications added yet. Tap "Add medication" to start.
          </Text>
        </View>
      )}
      {items.map((item, idx) => (
        <ItemRow
          key={idx}
          index={idx}
          item={item}
          onUpdate={(patch) => update(idx, patch)}
          onRemove={() => remove(idx)}
        />
      ))}
      <Pressable
        onPress={add}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: 14,
          borderRadius: 12,
          borderWidth: 1,
          borderStyle: "dashed",
          borderColor: colors.primary,
          gap: 8,
        }}
        testID="button-add-prescription-item"
      >
        <Feather name="plus" size={18} color={colors.primary} />
        <Text style={{ fontWeight: "700", color: colors.primary }}>Add medication</Text>
      </Pressable>
    </View>
  );
}

function ItemRow({
  index,
  item,
  onUpdate,
  onRemove,
}: {
  index: number;
  item: PrescriptionItemDraft;
  onUpdate: (patch: Partial<PrescriptionItemDraft>) => void;
  onRemove: () => void;
}) {
  const colors = useColors();
  const [pickerOpen, setPickerOpen] = useState(false);
  const selected: MedicationEntry | undefined = useMemo(
    () => MEDICATIONS.find((m) => m.name.toLowerCase() === item.name.toLowerCase()),
    [item.name]
  );

  function pick(m: MedicationEntry) {
    onUpdate({
      name: m.name,
      strength: m.strengths[0] ?? "",
      form: m.forms[0] ?? "",
      sig: m.defaultSig,
      duration: m.defaultDuration ?? "",
    });
    setPickerOpen(false);
  }

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 10,
      }}
      testID={`prescription-item-${index}`}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Feather name="package" size={13} color={colors.primary} />
          <Text style={{ fontSize: 11, fontWeight: "700", color: colors.mutedForeground, letterSpacing: 1 }}>
            MEDICATION {index + 1}
          </Text>
        </View>
        <Pressable
          onPress={onRemove}
          style={{ padding: 4 }}
          hitSlop={8}
          accessibilityLabel="Remove medication"
        >
          <Feather name="trash-2" size={18} color={colors.destructive} />
        </Pressable>
      </View>

      {/* Name picker */}
      <View>
        <Text style={styles.label(colors)}>Medication name</Text>
        <Pressable
          onPress={() => setPickerOpen(true)}
          style={[styles.input(colors), { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}
          testID={`picker-med-${index}`}
        >
          <Text style={{ color: item.name ? colors.foreground : colors.mutedForeground, fontSize: 14, flex: 1 }} numberOfLines={1}>
            {item.name || "Tap to search formulary…"}
          </Text>
          <Feather name="search" size={16} color={colors.mutedForeground} />
        </Pressable>
      </View>

      {/* Strength + Form */}
      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label(colors)}>Strength</Text>
          {selected && selected.strengths.length > 1 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 2 }}>
              {selected.strengths.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => onUpdate({ strength: s })}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 8,
                    borderRadius: 8,
                    backgroundColor: item.strength === s ? colors.primary : colors.muted,
                    marginRight: 6,
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: "600", color: item.strength === s ? "#fff" : colors.foreground }}>{s}</Text>
                </Pressable>
              ))}
            </ScrollView>
          ) : (
            <TextInput
              value={item.strength}
              onChangeText={(t) => onUpdate({ strength: t })}
              placeholder="e.g. 500 mg"
              placeholderTextColor={colors.mutedForeground}
              style={styles.input(colors)}
              testID={`input-strength-${index}`}
            />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label(colors)}>Form</Text>
          <TextInput
            value={item.form}
            onChangeText={(t) => onUpdate({ form: t })}
            placeholder="e.g. capsule"
            placeholderTextColor={colors.mutedForeground}
            style={styles.input(colors)}
            testID={`input-form-${index}`}
          />
        </View>
      </View>

      {/* Quantity + Duration */}
      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label(colors)}>Quantity</Text>
          <TextInput
            value={item.quantity}
            onChangeText={(t) => onUpdate({ quantity: t })}
            placeholder="e.g. 15 caps"
            placeholderTextColor={colors.mutedForeground}
            style={styles.input(colors)}
            testID={`input-quantity-${index}`}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label(colors)}>Duration</Text>
          <TextInput
            value={item.duration}
            onChangeText={(t) => onUpdate({ duration: t })}
            placeholder="e.g. 5 days"
            placeholderTextColor={colors.mutedForeground}
            style={styles.input(colors)}
            testID={`input-duration-${index}`}
          />
        </View>
      </View>

      {/* Sig */}
      <View>
        <Text style={styles.label(colors)}>Dosage instructions (Sig)</Text>
        <TextInput
          value={item.sig}
          onChangeText={(t) => onUpdate({ sig: t })}
          placeholder="e.g. Take ONE capsule THREE times a day"
          placeholderTextColor={colors.mutedForeground}
          style={[styles.input(colors), { minHeight: 60, textAlignVertical: "top" }]}
          multiline
          testID={`input-sig-${index}`}
        />
      </View>

      {selected?.notes && (
        <View style={{ backgroundColor: "#FEF3C7", padding: 8, borderRadius: 8 }}>
          <Text style={{ fontSize: 11, color: "#92400E", lineHeight: 15 }}>
            <Text style={{ fontWeight: "700" }}>PIP note: </Text>{selected.notes}
          </Text>
        </View>
      )}

      {/* Picker modal */}
      <MedPicker visible={pickerOpen} onClose={() => setPickerOpen(false)} onPick={pick} />
    </View>
  );
}

function MedPicker({
  visible,
  onClose,
  onPick,
}: {
  visible: boolean;
  onClose: () => void;
  onPick: (m: MedicationEntry) => void;
}) {
  const colors = useColors();
  const [q, setQ] = useState("");
  const results = useMemo(() => (q.trim() ? searchMedications(q, 30) : MEDICATIONS.slice(0, 30)), [q]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 14,
            paddingBottom: 12,
            borderBottomWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.card,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <Text style={{ fontSize: 17, fontWeight: "700", color: colors.foreground }}>Select medication</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Feather name="x" size={22} color={colors.foreground} />
            </Pressable>
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              borderRadius: 10,
              backgroundColor: colors.muted,
              paddingHorizontal: 12,
              height: 42,
              gap: 8,
            }}
          >
            <Feather name="search" size={16} color={colors.mutedForeground} />
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder="Search by name, brand or category"
              placeholderTextColor={colors.mutedForeground}
              autoFocus
              style={{ flex: 1, color: colors.foreground, fontSize: 14 }}
            />
          </View>
        </View>
        <FlatList
          data={results}
          keyExtractor={(m) => m.name}
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <Pressable
              onPress={() => onPick(item)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderColor: colors.border,
              }}
              testID={`med-row-${item.name}`}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ fontWeight: "700", color: colors.foreground, fontSize: 15, flex: 1 }} numberOfLines={1}>
                  {item.name}
                </Text>
                <View
                  style={{
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 4,
                    backgroundColor: item.pomOrP === "POM" ? "#FEE2E2" : item.pomOrP === "P" ? "#FEF3C7" : "#DCFCE7",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "700",
                      color: item.pomOrP === "POM" ? "#991B1B" : item.pomOrP === "P" ? "#92400E" : "#166534",
                    }}
                  >
                    {item.pomOrP}
                  </Text>
                </View>
              </View>
              <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 2 }}>
                {item.brand ? `${item.brand} · ` : ""}{item.category}
              </Text>
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={{ padding: 24, alignItems: "center" }}>
              <Text style={{ color: colors.mutedForeground }}>No medications match "{q}".</Text>
            </View>
          }
        />
      </View>
    </Modal>
  );
}

const styles = {
  label: (colors: ReturnType<typeof useColors>) => ({
    fontSize: 11,
    fontWeight: "700" as const,
    color: colors.mutedForeground,
    marginBottom: 4,
    letterSpacing: 0.5,
    textTransform: "uppercase" as const,
  }),
  input: (colors: ReturnType<typeof useColors>) => ({
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.foreground,
    fontSize: 14,
    backgroundColor: colors.background,
  }),
};
