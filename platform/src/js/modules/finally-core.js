
import steem from 'steem'
import $ from 'jquery'
import showdown from 'showdown'
import finallycomments from 'finallycomments'
import purify from 'dompurify'
import moment from 'moment'
import striptags from 'striptags'

const POST_LIMIT = 15;

let theme = {
  permlink: $('main').data('permlink'),
  username: $('main').data('username'),
  tag: $('main').data('tag'),
  lastPermlink: '',

  init(){
    $('main').addClass(`${theme.name}-theme`)
    theme.uiActions()
    theme.isBlogFeed() ? theme.initBlogFeed(false) : theme.loadSinglePost()
  },

  uiActions() {
    $('main').on('click','.load-more-posts', (e) => {
      e.preventDefault()
      theme.loadUserPosts(true)
    })
  },

  isBlogFeed(){
    return $('main').hasClass('profile')
  },

  async loadSinglePost(){
    finallycomments.init()
    const postData = await steem.api.getContentAsync(theme.username, theme.permlink)
    theme.appendSingePostContent(postData)
    theme.appendSinglePostComments(postData)
  },

  appendSingePostContent(post) {
    var converter = new showdown.Converter();
    var html = purify.sanitize(converter.makeHtml(post.body))
    let template = theme.singlePageTemplate(post, html)
    $('main').append(template)
  },

  appendSinglePostComments(postData) {
    $('main').append(
    `<section class="post__comments"
    data-id="https://steemit.com/${postData.category}/@${postData.author}/${theme.permlink}"
    data-reputation="false"
    data-values="false"
    data-profile="false"
    data-generated="false"
    data-beneficiary="finallycomments"
    data-beneficiaryWeight="25"
    data-guestComments="false">
    </section>`)
      finallycomments.loadEmbed('.post__comments')
  },

  initBlogFeed(){
    $('main').append(theme.blogFeedTemplate())
    theme.loadUserPosts(false)
  },

  loadUserPosts(loadMore) {
    let query = { tag: theme.username, limit: POST_LIMIT }
    if(loadMore) {
    query = { tag: theme.username, limit: POST_LIMIT, start_author: theme.username,
      start_permlink: theme.lastPermlink }
    }
    steem.api.getDiscussionsByBlog(query, (err, result) => {
      console.log(result)
      let resultLessResteems = theme.filterOutResteems(result, theme.username)
      let posts = theme.tag !== '' ? theme.filterByTag(resultLessResteems, theme.tag) : resultLessResteems
      if (err === null) theme.loopUserPosts(loadMore, posts, result.length)
    })
  },

  filterByTag(posts, tag){
    return posts.filter(post => {
      let tags = JSON.parse(post.json_metadata).tags
      if( tags.includes(tag) || post.parent_permlink === tag ) return post
    })
  },

  filterOutResteems(posts, username){
    return posts.filter(post => post.author === username)
  },

  loopUserPosts(loadMore, posts, resultTotal){
      if (theme.lastPermlink == posts[posts.length -1].permlink) $('.load-more-posts').remove()
      theme.lastPermlink = posts[posts.length -1].permlink
      if (resultTotal < POST_LIMIT) $('.load-more-posts').remove()
      for (var i = 0; i < posts.length; i++) {
        if(loadMore && i === 0) continue
        theme.appendPostItem(posts[i])
      }
  },

  appendPostItem(post){
    const tags = theme.getPostTags(post)
    const excerpt = theme.getPostExcerpt(post)
    const featureImageSrc = theme.generatePostFeatureImage(post)
    const template = theme.blogFeedItemTemplate(post, featureImageSrc, tags, excerpt)
    $('.blog-feed').append(template)
  },

  getPostTags(post){
    const tags = JSON.parse(post.json_metadata).tags
    return tags.map( t => `<span class="tag">${t}</span>`).join(' ')
  },

  getPostExcerpt(post){
    const converter = new showdown.Converter();
    let placeholder = document.createElement('div');
    placeholder.innerHTML = purify.sanitize(converter.makeHtml(post.body))
    placeholder = placeholder.querySelector('p').innerHTML;
    return striptags(placeholder)
  },


  generatePostFeatureImage(post){
    let image
    if( typeof JSON.parse(post.json_metadata).image === 'undefined' ){
      const converter = new showdown.Converter();
      const placeholder = document.createElement('div');
      placeholder.innerHTML = purify.sanitize(converter.makeHtml(post.body))
      let image = placeholder.querySelector('img');
      return image ? image.src : '';
    } else {
      image = JSON.parse(post.json_metadata).image[0]
    }
    return image;
  }

}

module.exports.init = (name, blogFeedTemplate, blogFeedItemTemplate, singlePageTemplate) => {
  theme.name = name
  theme.blogFeedTemplate = blogFeedTemplate
  theme.blogFeedItemTemplate = blogFeedItemTemplate
  theme.singlePageTemplate = singlePageTemplate
  theme.init()
}
