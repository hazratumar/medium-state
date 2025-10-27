chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "call") {
    const { first, after, orderBy, filter } = request.params;
    const orderByObject =
      orderBy === "latest-desc"
        ? { publishedAt: "DESC" }
        : orderBy === "oldest-asc"
        ? { publishedAt: "ASC" }
        : orderBy === "views-desc"
        ? { viewCount: "DESC" }
        : orderBy === "views-asc"
        ? { viewCount: "ASC" }
        : orderBy === "reads-desc"
        ? { readCount: "DESC" }
        : orderBy === "reads-asc"
        ? { readCount: "ASC" }
        : orderBy === "earnings-desc"
        ? { lifetimeEarnings: "DESC" }
        : orderBy === "earnings-asc"
        ? { lifetimeEarnings: "ASC" }
        : { publishedAt: "DESC" }; // default fallback

    const payload = [
      {
        operationName: "UserLifetimeStoryStatsPostsQuery",
        query:
          "query UserLifetimeStoryStatsPostsQuery($username: ID!, $first: Int!, $after: String!, $orderBy: UserPostsOrderBy, $filter: UserPostsFilter) {\n  user(username: $username) {\n    id\n    postsConnection(\n      first: $first\n      after: $after\n      orderBy: $orderBy\n      filter: $filter\n    ) {\n      __typename\n      edges {\n        ...UserLifetimeStoryStats_relayPostEdge\n        __typename\n      }\n      pageInfo {\n        endCursor\n        hasNextPage\n        __typename\n      }\n    }\n    __typename\n  }\n}\n\nfragment userUrl_user on User {\n  __typename\n  id\n  customDomainState {\n    live {\n      domain\n      __typename\n    }\n    __typename\n  }\n  hasSubdomain\n  username\n}\n\nfragment usePostUrl_post on Post {\n  id\n  creator {\n    ...userUrl_user\n    __typename\n    id\n  }\n  collection {\n    id\n    domain\n    slug\n    __typename\n  }\n  isSeries\n  mediumUrl\n  sequence {\n    slug\n    __typename\n  }\n  uniqueSlug\n  __typename\n}\n\nfragment Star_post on Post {\n  id\n  creator {\n    id\n    __typename\n  }\n  isLocked\n  __typename\n}\n\nfragment UserAvatar_user on User {\n  __typename\n  id\n  imageId\n  membership {\n    tier\n    __typename\n    id\n  }\n  name\n  username\n  ...userUrl_user\n}\n\nfragment PostPreviewBylineAuthorAvatar_user on User {\n  ...UserAvatar_user\n  __typename\n  id\n}\n\nfragment isUserVerifiedBookAuthor_user on User {\n  verifications {\n    isBookAuthor\n    __typename\n  }\n  __typename\n  id\n}\n\nfragment UserLink_user on User {\n  ...userUrl_user\n  __typename\n  id\n}\n\nfragment UserName_user on User {\n  id\n  name\n  ...isUserVerifiedBookAuthor_user\n  ...UserLink_user\n  __typename\n}\n\nfragment PostPreviewByLineAuthor_user on User {\n  ...PostPreviewBylineAuthorAvatar_user\n  ...UserName_user\n  __typename\n  id\n}\n\nfragment collectionUrl_collection on Collection {\n  id\n  domain\n  slug\n  __typename\n}\n\nfragment CollectionAvatar_collection on Collection {\n  name\n  avatar {\n    id\n    __typename\n  }\n  ...collectionUrl_collection\n  __typename\n  id\n}\n\nfragment SignInOptions_collection on Collection {\n  id\n  name\n  __typename\n}\n\nfragment SignUpOptions_collection on Collection {\n  id\n  name\n  __typename\n}\n\nfragment SusiModal_collection on Collection {\n  name\n  ...SignInOptions_collection\n  ...SignUpOptions_collection\n  __typename\n  id\n}\n\nfragment PublicationFollowButton_collection on Collection {\n  id\n  slug\n  name\n  ...SusiModal_collection\n  __typename\n}\n\nfragment EntityPresentationRankedModulePublishingTracker_entity on RankedModulePublishingEntity {\n  __typename\n  ... on Collection {\n    id\n    __typename\n  }\n  ... on User {\n    id\n    __typename\n  }\n}\n\nfragment CollectionTooltip_collection on Collection {\n  id\n  name\n  slug\n  description\n  subscriberCount\n  customStyleSheet {\n    header {\n      backgroundImage {\n        id\n        __typename\n      }\n      __typename\n    }\n    __typename\n    id\n  }\n  ...CollectionAvatar_collection\n  ...PublicationFollowButton_collection\n  ...EntityPresentationRankedModulePublishingTracker_entity\n  __typename\n}\n\nfragment CollectionLinkWithPopover_collection on Collection {\n  name\n  ...collectionUrl_collection\n  ...CollectionTooltip_collection\n  __typename\n  id\n}\n\nfragment PostPreviewByLineCollection_collection on Collection {\n  ...CollectionAvatar_collection\n  ...CollectionTooltip_collection\n  ...CollectionLinkWithPopover_collection\n  __typename\n  id\n}\n\nfragment PostPreviewByLine_post on Post {\n  creator {\n    ...PostPreviewByLineAuthor_user\n    __typename\n    id\n  }\n  collection {\n    ...PostPreviewByLineCollection_collection\n    __typename\n    id\n  }\n  __typename\n  id\n}\n\nfragment TablePostInfos_post on Post {\n  id\n  title\n  readingTime\n  isLocked\n  visibility\n  firstBoostedAt\n  ...usePostUrl_post\n  ...Star_post\n  ...PostPreviewByLine_post\n  __typename\n}\n\nfragment usePostStatsUrl_post on Post {\n  id\n  creator {\n    id\n    username\n    __typename\n  }\n  __typename\n}\n\nfragment shouldDisplayFeaturedIcon_post on Post {\n  id\n  isFeaturedInPublishedPublication\n  collection {\n    id\n    __typename\n  }\n  __typename\n}\n\nfragment StoryStatsTableRow_post on Post {\n  id\n  isLocked\n  totalStats {\n    presentations\n    views\n    reads\n    __typename\n  }\n  earnings {\n    total {\n      currencyCode\n      nanos\n      units\n      __typename\n    }\n    __typename\n  }\n  ...TablePostInfos_post\n  ...usePostStatsUrl_post\n  ...shouldDisplayFeaturedIcon_post\n  __typename\n}\n\nfragment StoryStatsTable_post on Post {\n  ...StoryStatsTableRow_post\n  __typename\n  id\n}\n\nfragment MobileStoryStatsTable_post on Post {\n  id\n  isLocked\n  totalStats {\n    presentations\n    reads\n    views\n    __typename\n  }\n  earnings {\n    total {\n      currencyCode\n      nanos\n      units\n      __typename\n    }\n    __typename\n  }\n  ...TablePostInfos_post\n  ...usePostStatsUrl_post\n  ...shouldDisplayFeaturedIcon_post\n  __typename\n}\n\nfragment LifetimeStoryStats_post on Post {\n  id\n  ...StoryStatsTable_post\n  ...MobileStoryStatsTable_post\n  __typename\n}\n\nfragment UserLifetimeStoryStats_relayPostEdge on RelayPostEdge {\n  node {\n    id\n    firstPublishedAt\n    ...LifetimeStoryStats_post\n    __typename\n  }\n  __typename\n}\n",
        variables: {
          username: "codebyumar",
          first,
          after,
          orderBy: orderByObject,
          filter: { published: filter },
        },
      },
    ];

    fetch("https://medium.com/_/graphql", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((r) => r.json())
      .then((data) => sendResponse({ data }))
      .catch(() => sendResponse(false));
    return true;
  }
});
