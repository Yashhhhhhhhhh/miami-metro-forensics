with open("index.html", "r") as f:
    content = f.read()

content = content.replace("""<<<<<<< HEAD
                const sMove = (e) => {
                    if(State.isScrubbing) {
                        const now = Date.now();
                        if (now - lastScrubTime > 16) {
                            calcScrub(e);
=======
                const sMove = (e) => {
                    if(State.isScrubbing) {
                        const now = Date.now();
                        if (now - lastScrubTime > 16) {
                            calcScrub(e);
>>>>>>> branch_temp_rebase""", """                const sMove = (e) => {
                    if(State.isScrubbing) {
                        const now = Date.now();
                        if (now - lastScrubTime > 16) {
                            calcScrub(e); """)

with open("index.html", "w") as f:
    f.write(content)
