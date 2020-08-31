// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';


function onWindowLoad() {

  var message = document.querySelector('#message');

  chrome.tabs.executeScript(null, {
    file: "getPageSource.js"
  }, function() {
    // If you try and inject into an extensions page or the webstore/NTP you'll get an error
    if (chrome.runtime.lastError) {
      message.innerText = 'There was an error injecting script : \n' + chrome.runtime.lastError.message;
    }
  });

}

window.onload = onWindowLoad;


const container = document.querySelector(".post-container");

const renderPosts = () => {
  // Our proxy that makes cross origin fetching possible

  chrome.runtime.onMessage.addListener(function(request, sender) {
    if (request.action == "getSource") {
        message.innerHTML = request.source;

        const proxy = "https://cors-anywhere.herokuapp.com/";

        var strLength = message.innerText.split(' ').length;
        var numWordsSearch = 0;
        if(strLength < 8){
          numWordsSearch = strLength;
          
        }
        else{
          numWordsSearch = 6;
        }
        var productSearch = getWords(message.innerText, numWordsSearch);
        console.log(productSearch);
        fetch(`${proxy}https://www.reddit.com/search.json?q=` + productSearch + `&sort=top.json`)
          .then(function(res) {
            // Return the response in JSON format
            return res.json();
          })
          .then(function(res) {
            // We render our posts to the UI in this block
            let currPost, markup = ``;

            // The array that contains our posts
            var postsArr = res.data.children;

            postsArr.sort(function(a, b){return b.data.num_comments-a.data.num_comments});

            // Add a title based on post type
            markup = `<h3>Reddit Discussions for this product</h3>`;

            // Iterate through our posts array and chain
            // the markup based on our HTML structure
            for (let i = 0; i < postsArr.length; i++) {

              currPost = postsArr[i].data; // a single post object
              if (currPost.num_comments > 0){
                markup += `
                  <a class="post" href="https://www.reddit.com${currPost.permalink}" target="_blank">
                    <div class="title"> ${currPost.title} </div>
                    <div class="subreddit"> ${currPost.subreddit} </div>
                    <div class="num_comments">${currPost.num_comments} comments</div>
                    <div class="author"> Posted by ${currPost.author} </div>
                    <br><br>
                  </a>`;
                }
            }
            // Insert the markup HTML to our container
            container.insertAdjacentHTML('afterbegin', markup);
          })
          .catch(function(err) {
            console.log(err); // Log error if any
          });    
    }
  });

};

function getWords(str, numOfWords) {
    return str.split(/\s+/).slice(0,numOfWords).join(" ");
}

renderPosts();