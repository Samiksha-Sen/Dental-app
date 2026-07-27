import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Send, Bot } from 'lucide-react-native';
import GlassCard from '../../src/components/GlassCard';
import TypingDots from '../../src/animations/TypingDots';
import FadeSlideIn from '../../src/animations/FadeSlideIn';
import { colors, gradients, radii, spacing, typography } from '../../src/theme/tokens';

const SUGGESTIONS = ['Tell me about tooth 36', 'What is caries?', 'When is extraction needed?'];

// Keyword-matched canned responses — accepted, in-scope behavior for this
// project; not wired to a real LLM.
function getBotReply(userMsg) {
  const q = userMsg.toLowerCase();
  if (q.includes('36') || q.includes('tooth 36')) {
    return 'Tooth 36 displays deep enamel decay on its mesial margin. Model confidence is 94.7%. The surgical extraction risk index is 82% due to proximal nerve decay threat.';
  }
  if (q.includes('caries') || q.includes('decay')) {
    return 'Dental AI (caries_model1.h5) segmentations isolate enamel attenuation densities to map demineralization margins. Sensitivity values can be configured in your settings.';
  }
  if (q.includes('extraction')) {
    return 'Surgical extraction is indicated when caries compromise crown structure. Root Canal Therapy (RCT) with pulp capping remains a conservative alternate.';
  }
  return "I've analyzed the clinical datasets for your query. Could you specify which lower teeth quadrant details you would like?";
}

export default function Chat() {
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { sender: 'bot', text: 'Hello, Doctor. I can describe tooth pathology or treatment alternatives for Tooth 36.' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const prevLen = useRef(chatMessages.length);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (chatMessages.length > prevLen.current) {
      const last = chatMessages[chatMessages.length - 1];
      if (last.sender === 'bot') setIsTyping(false);
    }
    prevLen.current = chatMessages.length;
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60);
  }, [chatMessages]);

  const handleChatSend = () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setChatInput('');

    setTimeout(() => {
      setChatMessages((prev) => [...prev, { sender: 'bot', text: getBotReply(userMsg) }]);
    }, 750);
  };

  const onSend = () => {
    if (!chatInput.trim()) return;
    setIsTyping(true);
    handleChatSend();
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>AI Clinical Diagnostics Assistant</Text>

      <ScrollView ref={scrollRef} style={{ flex: 1, marginVertical: spacing.md }} contentContainerStyle={{ paddingBottom: spacing.md }}>
        {chatMessages.map((msg, idx) => (
          <FadeSlideIn key={idx} from={8}>
            <View style={[styles.bubble, msg.sender === 'user' ? styles.bubbleUser : styles.bubbleBot]}>
              {msg.sender === 'bot' && <Bot color={colors.cyanLight} size={14} style={{ marginBottom: 4 }} />}
              <Text style={[styles.bubbleTxt, msg.sender === 'user' && styles.bubbleTxtUser]}>{msg.text}</Text>
            </View>
          </FadeSlideIn>
        ))}
        {isTyping && (
          <View style={[styles.bubble, styles.bubbleBot, { paddingVertical: 4 }]}>
            <TypingDots />
          </View>
        )}
      </ScrollView>

      <View style={styles.suggestRow}>
        {SUGGESTIONS.map((s) => (
          <TouchableOpacity key={s} style={styles.suggestChip} onPress={() => setChatInput(s)}>
            <Text style={styles.suggestTxt}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.tray}>
        <TextInput
          style={styles.input}
          placeholder="Ask about tooth 36..."
          placeholderTextColor={colors.textMuted}
          value={chatInput}
          onChangeText={setChatInput}
          onSubmitEditing={onSend}
        />
        <TouchableOpacity onPress={onSend}>
          <LinearGradient colors={gradients.primary} style={styles.sendBtn}>
            <Send color="#fff" size={16} />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: spacing.lg, paddingTop: 50 },
  title: { ...typography.h2, color: colors.textPrimary },
  bubble: { maxWidth: '82%', borderRadius: radii.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginBottom: spacing.sm },
  bubbleUser: { alignSelf: 'flex-end', backgroundColor: colors.primary },
  bubbleBot: { alignSelf: 'flex-start', backgroundColor: colors.glassFillStrong, borderWidth: 1, borderColor: colors.glassBorder },
  bubbleTxt: { color: colors.textPrimary, fontSize: typography.body.fontSize, lineHeight: 19 },
  bubbleTxtUser: { color: '#fff' },
  suggestRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.sm },
  suggestChip: {
    borderWidth: 1, borderColor: colors.glassBorder, backgroundColor: colors.glassFill,
    borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: 6,
  },
  suggestTxt: { color: colors.textSecondary, fontSize: 11 },
  tray: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  input: {
    flex: 1, height: 48, borderRadius: radii.md, borderWidth: 1, borderColor: colors.glassBorder,
    backgroundColor: colors.glassFill, paddingHorizontal: spacing.md, color: colors.textPrimary,
  },
  sendBtn: { width: 48, height: 48, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' },
});
