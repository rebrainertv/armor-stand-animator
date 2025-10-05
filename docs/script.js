async function fetchDocs() {
    let changelog = await fetch('docs.md').then(result => result.text());
    
    document.getElementById("docs").innerHTML = markdownit({html: true}).render(changelog)

    // Create table of contents
    let ungroupedHeaders = Array.from(document.getElementById("docs").children).filter(child => ['h1', 'h2', 'h3'].includes(child.tagName.toLowerCase()))
    let groupedheaders = [];
    let group = -1;
    for(let header of ungroupedHeaders) {
        if(header.tagName.toLowerCase() === 'h1') {
            group++;
            groupedheaders.push([])
            groupedheaders[group].push(header)
        } else {
            groupedheaders[group].push(header)
        }
    }

    console.log(groupedheaders)

    for(let group of groupedheaders) {
        function createTitleEntry(originalEl) {
            let el = document.createElement("li");
            el.innerHTML = originalEl.innerHTML;
            el.onclick = function() {
                originalEl.scrollIntoView({behavior: 'smooth'});
            }

            return el;
        }

        
        document.getElementById('table-of-contents').appendChild(createTitleEntry(group[0]));

        if(group.length > 1) {
            let subheaderel = document.createElement("li");
            subheaderel.classList = ['sublist-container'];
            let subheaderlist = document.createElement("ul");
            subheaderel.appendChild(subheaderlist);
    
            for(let header of group.slice(1)) {
                subheaderlist.appendChild(createTitleEntry(header));
            }
    
            document.getElementById('table-of-contents').appendChild(subheaderel);
        }
    }
}

fetchDocs();
