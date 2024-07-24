document.addEventListener('DOMContentLoaded', function () {
    const links = document.querySelectorAll('.nav-link');

    for (const link of links) {
        link.addEventListener('click', function (event) {
            event.preventDefault();

            const targetID = this.getAttribute('href');
            const targetSection = document.querySelector(targetID);

            window.scrollTo({
                top: targetSection.offsetTop - document.querySelector('.navbar').offsetHeight,
                behavior: 'smooth'
            });
        });
    }
});

document.addEventListener('DOMContentLoaded', function () {
    const lines = [
        "Hi! I'm Umar Javaid, a passionate computer engineering student with experience in",
        "embedded systems, FPGA development, robotics, machine learning, and game development.",
        "I have worked on several exciting projects, including building autonomous robots, creating",
        " digital games, and developing advanced image processing algorithms. I'm always eager to",
        "learn and apply new technologies to solve real-world problems."
    ];
    let lineIndex = 0;
    let charIndex = 0;
    const speed = 35; // typing speed in milliseconds
    const typingElements = [
        document.getElementById('typing1'),
        document.getElementById('typing2'),
        document.getElementById('typing3'),
        document.getElementById('typing4'),
        document.getElementById('typing5')
    ];

    function typeWriter() {
        if (lineIndex < lines.length) {
            const currentLine = lines[lineIndex];
            if (charIndex < currentLine.length) {
                typingElements[lineIndex].textContent += currentLine.charAt(charIndex);
                charIndex++;
                setTimeout(typeWriter, speed);
            } else {
                // Remove the caret after finishing typing the line
                typingElements[lineIndex].style.borderRight = "none";
                charIndex = 0;
                lineIndex++;
                setTimeout(typeWriter, speed); // Add delay before typing the next line
            }
        }
    }

    typeWriter();
});



