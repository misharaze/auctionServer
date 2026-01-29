export const rememberAuctionView = (auctionId) => {
  const key = "auction_views";
  const list = JSON.parse(localStorage.getItem(key) || "[]");
  const next = [auctionId, ...list.filter((x) => x !== auctionId)].slice(0, 50);
  localStorage.setItem(key, JSON.stringify(next));
};

export const getAuctionViews = () => {
  const key = "auction_views";
  return JSON.parse(localStorage.getItem(key) || "[]");
};
