async function fetchChangelog() {
    let changelog = await fetch('changelog.md').then(result => result.text());
    
    document.getElementById("changelog").innerHTML = markdownit({html: true}).render(changelog)
}

fetchChangelog();
