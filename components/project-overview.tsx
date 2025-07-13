import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  Bot,
  Brain,
  FileText,
  MessageSquare,
  Search,
  Sparkles,
  Upload,
} from "lucide-react";

const ProjectOverview = () => {
  const features = [
    {
      icon: <Upload className="w-4 h-4" />,
      text: "Upload PDF documents to create your knowledge base",
    },
    {
      icon: <Search className="w-4 h-4" />,
      text: "Ask questions about your uploaded content",
    },
    {
      icon: <Brain className="w-4 h-4" />,
      text: "Get intelligent responses based on your documents",
    },
    {
      icon: <MessageSquare className="w-4 h-4" />,
      text: "Natural conversation with your assistant",
    },
  ];

  const examples = [
    '"What does the document say about sales in Q3?"',
    '"Summarize the key points of the contract"',
    '"What are the technical requirements mentioned?"',
  ];

  return (
    <motion.div
      className="w-full max-w-2xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-4">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", bounce: 0.3 }}
            className="flex items-center justify-center gap-3 mb-2"
          >
            <div className="relative">
              <Bot className="w-8 h-8 text-primary" />
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute -top-1 -right-1"
              >
                <Sparkles className="w-4 h-4 text-yellow-500" />
              </motion.div>
            </div>
            <div className="h-6 w-px bg-border" />
            <FileText className="w-6 h-6 text-muted-foreground" />
          </motion.div>

          <CardTitle className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            PasiChat - Your Second Brain
          </CardTitle>

          <CardDescription className="text-base">
            Intelligent assistant powered by AI to manage your knowledge
          </CardDescription>

          <div className="flex justify-center gap-2 mt-3">
            <Badge variant="secondary" className="text-xs">
              <Brain className="w-3 h-3 mr-1" />
              RAG
            </Badge>
            <Badge variant="secondary" className="text-xs">
              <Sparkles className="w-3 h-3 mr-1" />
              GPT-3.5
            </Badge>
            <Badge variant="secondary" className="text-xs">
              <FileText className="w-3 h-3 mr-1" />
              PDF
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
              >
                <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                  {feature.icon}
                </div>
                <span className="text-sm text-muted-foreground">
                  {feature.text}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-dashed" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Usage examples
              </span>
            </div>
          </div>

          {/* Examples */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="space-y-2"
          >
            <p className="text-sm text-muted-foreground text-center mb-3">
              Try questions like these:
            </p>
            <div className="space-y-2">
              {examples.map((example, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-md p-2"
                >
                  <MessageSquare className="w-3 h-3 flex-shrink-0" />
                  <span className="font-mono">{example}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Call to Action */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="text-center pt-2"
          >
            <p className="text-xs text-muted-foreground">
              Upload your first document below to get started 👇
            </p>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ProjectOverview;
