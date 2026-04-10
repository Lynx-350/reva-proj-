import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Shield, 
  MessageSquare, 
  Image as ImageIcon, 
  AlertTriangle, 
  Heart, 
  Search, 
  Send, 
  Info, 
  CheckCircle2, 
  XCircle,
  ArrowRight,
  UserX,
  Lock,
  PhoneCall,
  HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { analyzeContent, getSupportResponse, analyzeImage, SafetyAnalysis } from "@/src/lib/gemini";

// --- Types ---
interface Message {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: Date;
}

// --- Components ---

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  const [activeTab, setActiveTab] = useState("dashboard");
  const [scanText, setScanText] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<SafetyAnalysis | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>("");
  
  const [chatMessages, setChatMessages] = useState<Message[]>([
    {
      id: "1",
      role: "model",
      text: "Hi there. I'm SafeGuard AI. I'm here to listen and help you stay safe online. How are you feeling today?",
      timestamp: new Date()
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages, isTyping]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginEmail && loginPassword) {
      setIsLoggedIn(true);
      toast.success("Welcome back!", {
        description: "You have successfully logged in."
      });
    } else {
      toast.error("Login failed", {
        description: "Please enter both email and password."
      });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageMimeType(file.type);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleScan = async () => {
    if (!scanText.trim() && !selectedImage) return;
    setIsScanning(true);
    setScanResult(null);
    try {
      let result: SafetyAnalysis;
      if (selectedImage) {
        const base64Data = selectedImage.split(",")[1];
        result = await analyzeImage(base64Data, imageMimeType);
      } else {
        result = await analyzeContent(scanText);
      }
      
      setScanResult(result);
      if (result.isToxic) {
        toast.error("Potential safety risk detected", {
          description: "This content contains toxic elements."
        });
      } else {
        toast.success("Content looks safe", {
          description: "No immediate threats detected."
        });
      }
    } catch (error) {
      toast.error("Analysis failed", {
        description: "Please try again later."
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      text: chatInput,
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setIsTyping(true);

    try {
      const history = chatMessages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));
      
      const response = await getSupportResponse(chatInput, history);
      
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "model",
        text: response || "I'm sorry, I'm having trouble responding right now.",
        timestamp: new Date()
      };
      
      setChatMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      toast.error("Chat failed", {
        description: "Could not connect to SafeGuard AI."
      });
    } finally {
      setIsTyping(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <Toaster position="top-center" />
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card className="border-none shadow-2xl">
            <CardHeader className="text-center space-y-2">
              <div className="mx-auto bg-indigo-600 p-3 rounded-2xl w-fit">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold">SafeGuard AI</CardTitle>
              <CardDescription>Authorize to access your safety companion</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Email Address</label>
                  <Input 
                    type="email" 
                    placeholder="name@example.com" 
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Password</label>
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 h-11">
                  Sign In
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Separator />
              <p className="text-xs text-center text-slate-500">
                By signing in, you agree to our Terms of Service and Privacy Policy.
              </p>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-indigo-100">
      <Toaster position="top-center" />
      
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-xl">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">SafeGuard <span className="text-indigo-600">AI</span></span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <button onClick={() => setActiveTab("dashboard")} className={`text-sm font-medium transition-colors ${activeTab === "dashboard" ? "text-indigo-600" : "text-slate-500 hover:text-slate-900"}`}>Dashboard</button>
            <button onClick={() => setActiveTab("scanner")} className={`text-sm font-medium transition-colors ${activeTab === "scanner" ? "text-indigo-600" : "text-slate-500 hover:text-slate-900"}`}>Content Scanner</button>
            <button onClick={() => setActiveTab("chat")} className={`text-sm font-medium transition-colors ${activeTab === "chat" ? "text-indigo-600" : "text-slate-500 hover:text-slate-900"}`}>Support Chat</button>
            <button onClick={() => setActiveTab("emergency")} className={`text-sm font-medium transition-colors ${activeTab === "emergency" ? "text-indigo-600" : "text-slate-500 hover:text-slate-900"}`}>Emergency Hub</button>
          </nav>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-100 px-3 py-1">
              Safety Score: 85%
            </Badge>
            <Avatar className="w-8 h-8 border">
              <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Ram" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="sm" onClick={() => setIsLoggedIn(false)} className="text-slate-500">Logout</Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <AnimatePresence mode="wait">
          {activeTab === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2 border-none shadow-sm bg-indigo-600 text-white overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Shield className="w-48 h-48" />
                  </div>
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold">Welcome</CardTitle>
                    <CardDescription className="text-indigo-100 text-lg">
                      Your digital world is currently stable. We've monitored 12 interactions today.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-8">
                    <div className="flex items-center gap-4">
                      <Button variant="secondary" onClick={() => setActiveTab("scanner")} className="bg-white text-indigo-600 hover:bg-indigo-50">
                        Scan New Content
                      </Button>
                      <Button variant="outline" onClick={() => setActiveTab("chat")} className="border-white/30 text-white hover:bg-white/10">
                        Talk to SafeGuard
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-500" />
                      Recent Alerts
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-100">
                      <div className="mt-1"><Info className="w-4 h-4 text-amber-600" /></div>
                      <div>
                        <p className="text-sm font-medium text-amber-900">Unusual Login Attempt</p>
                        <p className="text-xs text-amber-700">From Mumbai, India • 2h ago</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="mt-1"><CheckCircle2 className="w-4 h-4 text-emerald-600" /></div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">Profile Scan Complete</p>
                        <p className="text-xs text-slate-500">No fake accounts found using your photos.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { title: "Cyberbullying", icon: UserX, color: "text-rose-500", bg: "bg-rose-50", desc: "Detection & blocking" },
                  { title: "Photo Privacy", icon: Lock, color: "text-indigo-500", bg: "bg-indigo-50", desc: "Image misuse alerts" },
                  { title: "Fake Accounts", icon: Search, color: "text-amber-500", bg: "bg-amber-50", desc: "Identity protection" },
                  { title: "Mental Health", icon: Heart, color: "text-emerald-500", bg: "bg-emerald-50", desc: "Emotional support" },
                ].map((item, i) => (
                  <Card key={i} className="border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                    <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
                      <div className={`${item.bg} p-4 rounded-2xl group-hover:scale-110 transition-transform`}>
                        <item.icon className={`w-8 h-8 ${item.color}`} />
                      </div>
                      <h3 className="font-bold text-slate-900">{item.title}</h3>
                      <p className="text-xs text-slate-500">{item.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "scanner" && (
            <motion.div
              key="scanner"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-3xl mx-auto space-y-6"
            >
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">AI Content Scanner</h2>
                <p className="text-slate-500">Check messages or images for harmful content.</p>
              </div>

              <Tabs defaultValue="text" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="text" onClick={() => { setSelectedImage(null); setScanResult(null); }}>Text Scan</TabsTrigger>
                  <TabsTrigger value="image" onClick={() => { setScanText(""); setScanResult(null); }}>Image Scan</TabsTrigger>
                </TabsList>
                <TabsContent value="text">
                  <Card className="border-none shadow-lg overflow-hidden">
                    <CardHeader className="bg-white border-b">
                      <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Input Text</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <textarea
                        value={scanText}
                        onChange={(e) => setScanText(e.target.value)}
                        placeholder="Paste the text here..."
                        className="w-full h-48 p-6 text-lg resize-none focus:outline-none bg-white"
                      />
                    </CardContent>
                    <CardFooter className="bg-slate-50 p-4 flex justify-between items-center">
                      <p className="text-xs text-slate-400">Your data is analyzed privately.</p>
                      <Button 
                        onClick={handleScan} 
                        disabled={isScanning || !scanText.trim()}
                        className="bg-indigo-600 hover:bg-indigo-700"
                      >
                        {isScanning ? "Analyzing..." : "Analyze Now"}
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
                <TabsContent value="image">
                  <Card className="border-none shadow-lg overflow-hidden">
                    <CardHeader className="bg-white border-b">
                      <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Upload Image</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-12 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative">
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleImageChange}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        {selectedImage ? (
                          <div className="relative w-full max-w-xs">
                            <img src={selectedImage} alt="Selected" className="rounded-lg shadow-md max-h-64 mx-auto" referrerPolicy="no-referrer" />
                            <Button 
                              variant="destructive" 
                              size="icon" 
                              className="absolute -top-2 -right-2 rounded-full w-6 h-6"
                              onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="text-center space-y-2">
                            <div className="bg-indigo-100 p-4 rounded-full w-fit mx-auto">
                              <ImageIcon className="w-8 h-8 text-indigo-600" />
                            </div>
                            <p className="font-medium text-slate-900">Click or drag to upload</p>
                            <p className="text-xs text-slate-500">Supports PNG, JPG, WEBP</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="bg-slate-50 p-4 flex justify-between items-center">
                      <p className="text-xs text-slate-400">Images are scanned for privacy and safety.</p>
                      <Button 
                        onClick={handleScan} 
                        disabled={isScanning || !selectedImage}
                        className="bg-indigo-600 hover:bg-indigo-700"
                      >
                        {isScanning ? "Analyzing..." : "Analyze Image"}
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
              </Tabs>

              {scanResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className={`border-2 ${scanResult.isToxic ? "border-rose-100 bg-rose-50" : "border-emerald-100 bg-emerald-50"}`}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          {scanResult.isToxic ? (
                            <XCircle className="w-6 h-6 text-rose-500" />
                          ) : (
                            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                          )}
                          {scanResult.isToxic ? "Potential Risk Detected" : "Content Appears Safe"}
                        </CardTitle>
                        {scanResult.isToxic && (
                          <Badge variant="destructive" className="uppercase">
                            {scanResult.severity} Severity
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-slate-700 leading-relaxed">
                        {scanResult.reason}
                      </p>
                      {scanResult.suggestions.length > 0 && (
                        <div className="space-y-2">
                          <p className="font-bold text-sm text-slate-900">Recommended Actions:</p>
                          <ul className="space-y-1">
                            {scanResult.suggestions.map((s, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                                {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </motion.div>
          )}

          {activeTab === "chat" && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-4xl mx-auto h-[calc(100vh-12rem)] flex flex-col"
            >
              <Card className="flex-1 flex flex-col border-none shadow-xl overflow-hidden">
                <CardHeader className="border-b bg-white flex flex-row items-center gap-4 py-4">
                  <div className="bg-indigo-100 p-2 rounded-full">
                    <Shield className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">SafeGuard AI Companion</CardTitle>
                    <CardDescription className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Always here for you
                    </CardDescription>
                  </div>
                </CardHeader>
                
                <CardContent className="flex-1 p-0 overflow-hidden">
                  <ScrollArea className="h-full p-6" ref={scrollRef}>
                    <div className="space-y-6">
                      {chatMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div className={`flex gap-3 max-w-[80%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                            <Avatar className="w-8 h-8 shrink-0 border">
                              <AvatarImage src={msg.role === "user" ? "https://api.dicebear.com/7.x/avataaars/svg?seed=Ram" : "https://api.dicebear.com/7.x/bottts/svg?seed=SafeGuard"} />
                              <AvatarFallback>{msg.role === "user" ? "U" : "AI"}</AvatarFallback>
                            </Avatar>
                            <div className={`space-y-1 ${msg.role === "user" ? "items-end" : "items-start"}`}>
                              <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                msg.role === "user" 
                                  ? "bg-indigo-600 text-white rounded-tr-none" 
                                  : "bg-white text-slate-700 border rounded-tl-none"
                              }`}>
                                {msg.text}
                              </div>
                              <p className="text-[10px] text-slate-400 px-1">
                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                      {isTyping && (
                        <div className="flex justify-start">
                          <div className="flex gap-3">
                            <Avatar className="w-8 h-8 shrink-0 border">
                              <AvatarImage src="https://api.dicebear.com/7.x/bottts/svg?seed=SafeGuard" />
                              <AvatarFallback>AI</AvatarFallback>
                            </Avatar>
                            <div className="bg-white border p-4 rounded-2xl rounded-tl-none flex gap-1">
                              <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" />
                              <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                              <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>

                <CardFooter className="p-4 border-t bg-white">
                  <form 
                    onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                    className="flex w-full gap-2"
                  >
                    <Input 
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Type your message here..."
                      className="flex-1 bg-slate-50 border-none focus-visible:ring-indigo-500"
                    />
                    <Button type="submit" size="icon" disabled={!chatInput.trim() || isTyping} className="bg-indigo-600 hover:bg-indigo-700">
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                </CardFooter>
              </Card>
            </motion.div>
          )}

          {activeTab === "emergency" && (
            <motion.div
              key="emergency"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto space-y-8"
            >
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold tracking-tight text-rose-600">Emergency Hub</h2>
                <p className="text-slate-500 text-lg">If you're in immediate danger or need urgent help, use these resources.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-2 border-rose-100 bg-rose-50 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-rose-700">
                      <PhoneCall className="w-5 h-5" />
                      Helplines
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-rose-100">
                      <div>
                        <p className="font-bold text-slate-900">Cyber Crime Helpline</p>
                        <p className="text-sm text-slate-500">National reporting portal</p>
                      </div>
                      <Button variant="outline" className="text-rose-600 border-rose-200 hover:bg-rose-50">1930</Button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-rose-100">
                      <div>
                        <p className="font-bold text-slate-900">Childline India</p>
                        <p className="text-sm text-slate-500">24/7 support for children</p>
                      </div>
                      <Button variant="outline" className="text-rose-600 border-rose-200 hover:bg-rose-50">1098</Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-indigo-600" />
                      Quick Reporting
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="outline" className="w-full justify-start gap-3 h-12">
                      <div className="bg-indigo-100 p-1.5 rounded-md"><ImageIcon className="w-4 h-4 text-indigo-600" /></div>
                      Report Image Misuse
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-3 h-12">
                      <div className="bg-amber-100 p-1.5 rounded-md"><UserX className="w-4 h-4 text-amber-600" /></div>
                      Report Impersonation
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-3 h-12">
                      <div className="bg-rose-100 p-1.5 rounded-md"><HelpCircle className="w-4 h-4 text-rose-600" /></div>
                      Legal Guidance
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-none shadow-sm bg-slate-900 text-white">
                <CardHeader>
                  <CardTitle>Safety Checklist</CardTitle>
                  <CardDescription className="text-slate-400">Steps to take if you are being bullied</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      { title: "Don't Respond", desc: "Bullies want a reaction. Stay calm and don't engage." },
                      { title: "Save Evidence", desc: "Take screenshots of messages, comments, and profiles." },
                      { title: "Tell Someone", desc: "Talk to a parent, teacher, or a trusted adult immediately." },
                    ].map((step, i) => (
                      <div key={i} className="space-y-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-sm">
                          {i + 1}
                        </div>
                        <h4 className="font-bold">{step.title}</h4>
                        <p className="text-sm text-slate-400">{step.desc}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="mt-auto border-t bg-white py-8">
        <div className="container mx-auto px-4 text-center space-y-4">
          <div className="flex items-center justify-center gap-2 opacity-50">
            <Shield className="w-5 h-5" />
            <span className="font-bold">SafeGuard AI</span>
          </div>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Empowering teenagers to reclaim their digital space. Built with empathy and AI to ensure no one has to face the internet in fear.
          </p>
          <div className="flex justify-center gap-6 text-xs text-slate-400">
            <a href="#" className="hover:text-indigo-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
