import { ArrowLeft, Search, Send, Lock } from 'lucide-react';
import { Input } from '@/Components/ui/input';
import { Button } from '@/Components/ui/button';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { db, getConversationId, sortByOldest } from '@/api/supabaseData';
import { decryptMessage, encryptMessage } from '@/api/messageCrypto';
import supabase from '@/api/supabaseClient';

const getOtherContact = (message, user) => {
    const mine = message.sender_id === user?.id || message.sender_email === user?.email;
    const id = mine ? message.receiver_id : message.sender_id;
    const email = mine ? message.receiver_email : message.sender_email;
    return {
        id,
        email,
        key: email || id,
    };
};

const isUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value || '');

const formatTime = (message) => {
    const raw = message.created_at || message.created_date || message.inserted_at;
    if (!raw) return '';
    return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(raw));
};

export default function Messages() {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const [messages, setMessages] = useState([]);
    const [selectedEmail, setSelectedEmail] = useState(null);
    const [draft, setDraft] = useState('');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const [mobileChatOpen, setMobileChatOpen] = useState(false);
    const [profilesByEmail, setProfilesByEmail] = useState({});
    const bottomRef = useRef(null);

    const requestedTo = searchParams.get('to');
    const requestedToId = searchParams.get('toId');
    const requestedConversation = searchParams.get('conversation');

    useEffect(() => {
        if (!user?.email) return;
        loadMessages();

        const interval = window.setInterval(loadMessages, 8000);
        const channel = supabase && user?.id
            ? supabase
                .channel(`messages-${user.id}`)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => {
                    const row = payload.new || payload.old;
                    if (row?.sender_id === user.id || row?.receiver_id === user.id) {
                        loadMessages();
                    }
                })
                .subscribe()
            : null;

        return () => {
            window.clearInterval(interval);
            if (channel) supabase.removeChannel(channel);
        };
    }, [user?.id, user?.email]);

    useEffect(() => {
        if (!requestedTo) return;
        setSelectedEmail(requestedTo);
        setMobileChatOpen(true);
    }, [requestedTo]);

    const decryptMessages = async (rows) => Promise.all(rows.map(async (message) => ({
        ...message,
        decryptedContent: await decryptMessage(message.conversation_id, message.content),
    })));

    const loadMessages = async () => {
        setError('');
        try {
            const rows = await db.messages.forUser(user.email);
            setMessages(await decryptMessages(rows));
            loadProfiles(rows);
        } catch (err) {
            console.error('Messages load error:', err);
            setError(err instanceof Error ? err.message : 'Nao foi possivel carregar mensagens.');
        } finally {
            setLoading(false);
        }
    };

    const loadProfiles = async (rows) => {
        const emails = [...new Set(rows.map((message) => getOtherContact(message, user).key).filter(Boolean))];
        if (requestedTo) emails.push(requestedTo);
        if (requestedToId) emails.push(requestedToId);

        const uniqueEmails = [...new Set(emails)];
        const pairs = await Promise.all(uniqueEmails.map(async (identity) => {
            const profile = await db.users.byIdentity(identity);
            return [identity, profile];
        }));

        const mapped = {};
        pairs.forEach(([identity, profile]) => {
            mapped[identity] = profile;
            if (profile?.email) mapped[profile.email] = profile;
            if (profile?.user_id) mapped[profile.user_id] = profile;
        });

        setProfilesByEmail(mapped);
    };

    const getContactProfile = (email) => profilesByEmail[email] || {};

    const getContactName = (email) => {
        const profile = getContactProfile(email);
        return profile.full_name || profile.nome_empresa || profile.email?.split('@')[0] || email?.split('@')[0] || email;
    };

    const getContactSubtitle = (email) => {
        const profile = getContactProfile(email);
        return profile.email || (isUuid(email) ? '' : email);
    };

    const getContactAvatar = (email) => {
        const profile = getContactProfile(email);
        return profile.foto_perfil || profile.avatar_url || null;
    };

    const contacts = useMemo(() => {
        const map = new Map();

        messages.forEach((message) => {
            const other = getOtherContact(message, user);
            if (!other.key) return;

            const current = map.get(other.key) || {
                otherEmail: other.key,
                otherId: other.id,
                messages: [],
                unread: 0,
            };

            current.messages.push(message);
            if (!message.lida && (message.receiver_id === user.id || message.receiver_email === user.email)) {
                current.unread += 1;
            }
            map.set(other.key, current);
        });

        if (requestedTo && !map.has(requestedTo)) {
            map.set(requestedTo, { otherEmail: requestedTo, messages: [], unread: 0 });
        }

        return [...map.values()]
            .map((contact) => {
                const ordered = sortByOldest(contact.messages);
                return { ...contact, messages: ordered, lastMessage: ordered.at(-1) };
            })
            .filter((contact) => {
                if (!search) return true;
                const term = search.toLowerCase();
                return contact.otherEmail.toLowerCase().includes(term) || getContactName(contact.otherEmail).toLowerCase().includes(term);
            })
            .sort((a, b) => {
                const aDate = new Date(a.lastMessage?.created_at || a.lastMessage?.created_date || 0).getTime();
                const bDate = new Date(b.lastMessage?.created_at || b.lastMessage?.created_date || 0).getTime();
                return bDate - aDate;
            });
    }, [messages, requestedTo, search, user?.email]);

    useEffect(() => {
        if (selectedEmail || contacts.length === 0) return;
        setSelectedEmail(contacts[0].otherEmail);
    }, [contacts, selectedEmail]);

    const activeContact = contacts.find((contact) => contact.otherEmail === selectedEmail) || (selectedEmail ? { otherEmail: selectedEmail, messages: [] } : null);
    const activeMessages = activeContact?.messages || [];

    useEffect(() => {
        if (!activeContact) return;
        window.setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 50);
    }, [activeContact, activeMessages.length]);

    const selectContact = async (contact) => {
        setSelectedEmail(contact.otherEmail);
        setMobileChatOpen(true);
        await Promise.all([...new Set(contact.messages.map((message) => message.conversation_id))].map((conversationId) => db.messages.markRead(conversationId, user.email)));
        loadMessages();
    };

    const sendMessage = async () => {
        const content = draft.trim();
        if (!content || !activeContact?.otherEmail) return;

        setSending(true);
        setError('');

        try {
            const contactProfile = getContactProfile(activeContact.otherEmail);
            const receiverId = requestedToId || activeContact.otherId || contactProfile?.user_id || (isUuid(activeContact.otherEmail) ? activeContact.otherEmail : null);
            const receiverEmail = contactProfile?.email || (!isUuid(activeContact.otherEmail) ? activeContact.otherEmail : null);
            if (!receiverId) {
                throw new Error('Nao foi possivel identificar o destinatario da mensagem. Abra o perfil novamente e tente enviar a mensagem.');
            }
            const conversationId = requestedConversation || getConversationId(user.email, receiverEmail || receiverId);
            const encryptedContent = await encryptMessage(conversationId, content);
            const saved = await db.messages.create({
                sender_id: user.id,
                receiver_id: receiverId,
                sender_email: user.email,
                receiver_email: receiverEmail,
                conversation_id: conversationId,
                content: encryptedContent,
                lida: false,
                job_id: null,
            });

            setMessages((prev) => [{ ...saved, decryptedContent: content }, ...prev]);
            setDraft('');

            await db.notifications.create({
                user_id: receiverId,
                usuario_email: receiverEmail,
                tipo: 'mensagem',
                titulo: 'Nova mensagem',
                mensagem: `${user.full_name || user.email} enviou uma mensagem.`,
                lida: false,
                referencia_id: conversationId,
                link: user.role === 'client' ? '/dashboard/messages' : '/client/messages',
            });
        } catch (err) {
            console.error('Send message error:', err);
            setError(err instanceof Error ? err.message : 'Nao foi possivel enviar a mensagem.');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="lg:space-y-6 -m-4 md:-m-8 lg:m-0">
            <div className="hidden lg:block">
                <h1 className="font-heading font-bold text-2xl text-foreground">Mensagens</h1>
                <p className="text-sm text-muted-foreground mt-1">Comunique-se com clientes, empresas e freelancers</p>
            </div>

            {error && <div className="m-3 lg:m-0 glass rounded-2xl p-4 text-sm text-destructive">{error}</div>}

            <div className="glass lg:rounded-2xl overflow-hidden h-[calc(100dvh-3.5rem)] md:h-dvh lg:h-[calc(100vh-200px)]">
                <div className="grid grid-cols-1 lg:grid-cols-3 h-full min-h-0">
                    <div className={`${mobileChatOpen ? 'hidden lg:block' : 'block'} border-r border-border/30 overflow-y-auto bg-background/95 lg:bg-transparent`}>
                        <div className="sticky top-0 z-10 p-3 border-b border-border/30 bg-background/95 backdrop-blur lg:bg-transparent">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input placeholder="Buscar contatos..." className="pl-10 bg-secondary/50 border-0 rounded-xl h-9 text-sm" value={search} onChange={(event) => setSearch(event.target.value)} />
                            </div>
                        </div>
                        <div className="divide-y divide-border/20">
                            {loading ? (
                                Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-16 animate-pulse bg-white/[0.02]" />)
                            ) : contacts.length === 0 ? (
                                <div className="p-6 text-center text-sm text-muted-foreground">Nenhum contato ainda.</div>
                            ) : contacts.map((contact) => {
                                const name = getContactName(contact.otherEmail);
                                const subtitle = getContactSubtitle(contact.otherEmail);
                                const avatar = getContactAvatar(contact.otherEmail);
                                const lastMessage = contact.lastMessage?.decryptedContent || 'Conversa iniciada';

                                return (
                                    <button
                                        key={contact.otherEmail}
                                        onClick={() => selectContact(contact)}
                                        className={`w-full p-3 sm:p-4 lg:p-3 flex items-center gap-3 text-left hover:bg-white/[0.03] transition-all ${activeContact?.otherEmail === contact.otherEmail ? 'bg-primary/5' : ''}`}
                                    >
                                        <div className="w-11 h-11 lg:w-10 lg:h-10 rounded-full lg:rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                            {avatar ? (
                                                <img src={avatar} alt={name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-white text-sm font-bold">{name[0]?.toUpperCase()}</span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-sm font-medium text-foreground truncate">{name}</span>
                                                <span className="flex-shrink-0 text-xs text-muted-foreground">{contact.lastMessage ? formatTime(contact.lastMessage) : ''}</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
                                            <p className="text-xs text-muted-foreground/80 truncate">{lastMessage}</p>
                                        </div>
                                        {contact.unread > 0 && (
                                            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                                                <span className="text-xs text-white font-medium">{contact.unread}</span>
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className={`${mobileChatOpen ? 'flex' : 'hidden lg:flex'} lg:col-span-2 flex-col min-h-0 bg-background/95 lg:bg-transparent`}>
                        <div className="h-14 lg:h-auto px-3 lg:p-4 border-b border-border/30 flex items-center gap-3 bg-background/95 backdrop-blur lg:bg-transparent flex-shrink-0">
                            <button className="lg:hidden w-9 h-9 rounded-full hover:bg-white/[0.06] flex items-center justify-center" onClick={() => setMobileChatOpen(false)}>
                                <ArrowLeft className="w-4 h-4 text-muted-foreground" />
                            </button>
                            <div className="w-9 h-9 lg:w-8 lg:h-8 rounded-full lg:rounded-lg bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center overflow-hidden flex-shrink-0">
                                {activeContact && getContactAvatar(activeContact.otherEmail) ? (
                                    <img src={getContactAvatar(activeContact.otherEmail)} alt={getContactName(activeContact.otherEmail)} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-white text-xs font-bold">{getContactName(activeContact?.otherEmail)?.[0]?.toUpperCase() || '?'}</span>
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <span className="font-heading font-semibold text-foreground truncate block">{activeContact ? getContactName(activeContact.otherEmail) : 'Selecione um contato'}</span>
                                {activeContact && <span className="text-xs text-muted-foreground truncate block">{getContactSubtitle(activeContact.otherEmail)}</span>}
                                <span className="hidden lg:flex text-xs text-muted-foreground items-center gap-1"><Lock className="w-3 h-3" /> mensagens criptografadas no cliente</span>
                            </div>
                        </div>

                        <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-2.5 min-h-0">
                            {!activeContact ? (
                                <div className="h-full flex items-center justify-center">
                                    <p className="text-sm text-muted-foreground">Selecione um contato para comecar</p>
                                </div>
                            ) : activeMessages.length === 0 ? (
                                <div className="h-full flex items-center justify-center">
                                    <p className="text-sm text-muted-foreground">Envie a primeira mensagem.</p>
                                </div>
                            ) : activeMessages.map((message) => {
                                const mine = message.sender_email === user.email;
                                return (
                                    <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[82%] sm:max-w-[70%] lg:max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow-sm ${mine ? 'bg-primary text-white rounded-br-sm' : 'bg-secondary text-foreground rounded-bl-sm'}`}>
                                            <p className="whitespace-pre-wrap break-words">{message.decryptedContent}</p>
                                            <span className={`block mt-1 text-[10px] ${mine ? 'text-white/60' : 'text-muted-foreground'}`}>{formatTime(message)}</span>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={bottomRef} />
                        </div>

                        <div className="p-2.5 sm:p-3 border-t border-border/30 flex gap-2 bg-background/95 backdrop-blur lg:bg-transparent flex-shrink-0">
                            <Input
                                placeholder={activeContact ? 'Digite sua mensagem...' : 'Selecione um contato'}
                                className="bg-secondary/70 border-0 rounded-full h-11 text-sm px-4"
                                value={draft}
                                disabled={!activeContact || sending}
                                onChange={(event) => setDraft(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter' && !event.shiftKey) {
                                        event.preventDefault();
                                        sendMessage();
                                    }
                                }}
                            />
                            <Button size="icon" disabled={!activeContact || sending || !draft.trim()} onClick={sendMessage} className="bg-gradient-to-r from-primary to-accent text-white border-0 rounded-full h-11 w-11 flex-shrink-0">
                                <Send className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
