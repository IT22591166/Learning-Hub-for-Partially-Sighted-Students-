#!/usr/bin/env python3
"""
VoiceLearn Pro Launcher
Quick access to the voice learning gamification system
"""
import webbrowser
import os

def main():
    # Path to the main voice gamification system (relative path)
    html_file = os.path.join(os.path.dirname(__file__), "voice-gamification.html")
    
    if os.path.exists(html_file):
        print("🎓 VoiceLearn Pro - Voice Learning Gamification System")
        print("=" * 55)
        print("✅ Launching voice learning system...")
        print("")
        print("🎯 Features Available:")
        print("  • Voice Questions & Answers")
        print("  • Difficulty Selection (Easy/Medium/Hard)")
        print("  • Progress Tracking & XP System")
        print("  • Badges & Achievement System")
        print("  • Real-time Accuracy Tracking")
        print("  • Streak Counter & Level System")
        print("")
        
        webbrowser.open(f"file:///{html_file}")
        print("🚀 Voice learning system opened in browser!")
        print("📝 Ready for interactive voice learning sessions!")
    else:
        print(f"❌ HTML file not found at: {html_file}")

if __name__ == "__main__":
    main()