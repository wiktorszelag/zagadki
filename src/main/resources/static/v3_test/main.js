document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('start-btn');
    const briefingUI = document.getElementById('briefing-ui');

    startBtn.addEventListener('click', () => {
        // Simple animation to transition out of briefing
        briefingUI.style.transition = 'all 0.5s ease-in';
        briefingUI.style.opacity = '0';
        briefingUI.style.transform = 'scale(0.9) translateY(-20px)';

        setTimeout(() => {
            alert('Symulacja rozpoczęta! (To jest wersja testowa wyglądu)');
            // In a real scenario, this would load the first puzzle round
            location.reload(); 
        }, 600);
    });

    // Add some random "hacker" effects to the background if we wanted
    // For now, let's keep it clean as requested for a premium feel
});
