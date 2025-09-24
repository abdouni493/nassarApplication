import { useState } from "react";
import { 
  User,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  ShieldCheck,
} from "lucide-react";
import { motion } from "framer-motion"; // ✅ animations
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";  // ✅ Import navigation hook

interface LoginProps {
  onLogin: (user: any) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const { toast } = useToast();
  const navigate = useNavigate(); // ✅ Initialize navigation

  const [credentials, setCredentials] = useState({
    login: "",
    password: ""
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
body: JSON.stringify({ login: credentials.login, password: credentials.password }),
      });

      if (response.ok) {
  const data = await response.json();
  toast({
    title: "Connexion réussie",
    description: `Bienvenue ${data.user?.email || ""}`,
  });

  // ✅ Save user in localStorage so POS can access it later
  localStorage.setItem("user", JSON.stringify(data.user));

  onLogin(data.user);

  // ✅ Redirect to Dashboard after login
  if (data.user.role === "admin") {
  navigate("/");
} else {
  navigate("/employee");
}

}
 else {
        const errorData = await response.json();
        toast({
          title: "Erreur de connexion",
          description: errorData.message || "Nom d'utilisateur/email ou mot de passe incorrect",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Login error:", err);
      toast({
        title: "Erreur",
        description: "Impossible de se connecter au serveur.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-success/5 p-4">
      <motion.div
        className="w-full max-w-md space-y-6"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* ✅ Logo with animation */}
        <motion.div
          className="flex items-center justify-center mb-4"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="p-2 rounded-full shadow-lg bg-white/80 backdrop-blur-md w-32 h-32 flex items-center justify-center hover:scale-110 transition-transform duration-500">
            <img 
              src="/IMG_1631.PNG" 
              alt="Nasser Equipements et Materiel" 
              className="w-28 h-28 object-contain rounded-full" 
            />
          </div>
        </motion.div>

        {/* Header */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-2xl font-bold text-gradient">Nasser</h1>
            <p className="text-sm text-muted-foreground">Equipements et Materiel</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-xl font-semibold">Connexion</h2>
            <p className="text-muted-foreground">Accédez à votre espace de gestion</p>
          </motion.div>
        </div>

        {/* Login Form */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                Identification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="login">Nom d'utilisateur ou Email</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="login"
                      type="text"
                      value={credentials.login}
                      onChange={(e) => setCredentials(prev => ({ ...prev, login: e.target.value }))}
                      placeholder="Email ou Nom d'utilisateur"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="password">Mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={credentials.password}
                      onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Votre mot de passe"
                      className="pl-10 pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full w-10"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full gradient-primary text-primary-foreground"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Connexion...
                    </div>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      Se connecter
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
